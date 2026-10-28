export type SaveSessionStatus = 'idle' | 'owned' | 'busy' | 'unavailable';
export type SaveSessionLockManager = Pick<LockManager, 'request'>;

export interface SaveSessionOptions {
  key: string;
  getLocks?: () => SaveSessionLockManager | null | undefined;
}

export interface SaveSession {
  readonly status: SaveSessionStatus;
  readonly canWrite: boolean;
  readonly error: unknown;
  acquire(): Promise<boolean>;
  release(): void;
}

interface Acquisition {
  result: Promise<boolean>;
  settle: (owned: boolean) => void;
  unlock: (() => void) | null;
}

/**
 * Hold the origin's save-slot lock for the entire writable session. A storage
 * lease cannot replace Web Locks safely: separate tabs can both win its check.
 * Unsupported hosts therefore fail closed instead of silently risking progress.
 */
export function createSaveSession(options: SaveSessionOptions): SaveSession;
export function createSaveSession({
  key,
  getLocks = () => globalThis.navigator?.locks,
}: Partial<SaveSessionOptions> = {}): SaveSession {
  if (typeof key !== 'string' || !key) throw new TypeError('A save key is required');
  const name = `brotd-save:${key}`;
  let status: SaveSessionStatus = 'idle';
  let error: unknown = null;
  let current: Acquisition | null = null;

  function unavailable(attempt: Acquisition, reason: unknown): void {
    if (current !== attempt) return;
    current = null;
    status = 'unavailable';
    error = reason;
    attempt.settle(false);
    attempt.unlock?.();
  }

  function acquire(): Promise<boolean> {
    if (current) return current.result;
    let settle!: (owned: boolean) => void;
    const result = new Promise<boolean>(resolve => { settle = resolve; });
    const attempt: Acquisition = { result, settle, unlock: null };
    current = attempt;
    status = 'idle';
    error = null;

    try {
      const locks = getLocks();
      if (!locks || typeof locks.request !== 'function') {
        throw new Error('Exclusive save sessions require the Web Locks API');
      }
      const requested = locks.request(name, { mode: 'exclusive', ifAvailable: true }, lock => {
        // A page can leave before its request callback runs. That callback must
        // never reopen writes, or disturb a newer acquisition after restoration.
        if (current !== attempt) return;
        if (!lock) {
          current = null;
          status = 'busy';
          attempt.settle(false);
          return;
        }
        return new Promise<void>(unlock => {
          attempt.unlock = unlock;
          status = 'owned';
          attempt.settle(true);
        });
      });
      void requested.then(
        () => {
          // The request must stay pending while we own the lock. Unexpected
          // completion is a lost lock, not permission to continue writing.
          unavailable(attempt, new Error('The exclusive save-session lock ended'));
        },
        reason => unavailable(attempt, reason),
      );
    } catch (reason) {
      unavailable(attempt, reason);
    }
    return result;
  }

  function release(): void {
    const attempt = current;
    current = null;
    status = 'idle';
    error = null;
    if (!attempt) return;
    // Revoke writes synchronously; native release follows the callback promise.
    attempt.settle(false);
    attempt.unlock?.();
  }

  return {
    get status() { return status; },
    get canWrite() { return status === 'owned'; },
    get error() { return error; },
    acquire,
    release,
  };
}
