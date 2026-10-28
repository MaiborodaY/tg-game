import { UnsupportedSaveVersionError } from './save-version.ts';

export type SaveStorageStatus = 'unread' | 'ready' | 'read-error' | 'corrupt' | 'write-error'
  | 'conflict' | 'unsupported' | 'session-blocked';
export type SavedRecord = Record<string, unknown>;

export interface SaveStorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SaveStorageOptions {
  key: string;
  getStorage?: () => SaveStorageBackend;
  // Decoding/migration is not proof that every gameplay field has been validated.
  decode?: (value: unknown) => unknown;
  // The browser adapter holds an exclusive Web Lock for every write, including reset.
  canWrite?: () => boolean;
  migrationBackup?: { key: string; needed: (value: unknown) => boolean };
}

interface SaveStatusResult {
  status: SaveStorageStatus;
}

export interface SaveSuccess extends SaveStatusResult {
  ok: true;
}

export interface SaveFailure extends SaveStatusResult {
  ok: false;
  error: unknown;
}

export interface SaveBlocked extends SaveStatusResult {
  ok: false;
  blocked: true;
}

export interface SaveLoaded extends SaveSuccess {
  value: SavedRecord | null;
}

export interface SaveRestoreRequired extends SaveLoaded {
  // A successful retry still protects the slot until load restores its contents.
  needsRestore: true;
}

export interface SaveResetConfirmationRequired extends SaveBlocked {
  needsConfirmation: true;
}

export type SaveLoadResult = SaveLoaded | SaveFailure;
export type SaveWriteResult = SaveSuccess | SaveFailure | SaveBlocked;
export type SaveRetryResult = SaveWriteResult | SaveRestoreRequired;
export type SaveResetResult = SaveWriteResult | SaveResetConfirmationRequired;

export interface SaveResetOptions {
  confirmation?: symbol | null;
}

// The optional type parameter constrains writes only. Reads still need validation.
export interface SaveStorage<Snapshot extends object = SavedRecord> {
  readonly status: SaveStorageStatus;
  load(): SaveLoadResult;
  save: (snapshot: Snapshot) => SaveWriteResult;
  retry: (snapshot: Snapshot) => SaveRetryResult;
  checkForUpdates(): SaveWriteResult;
  protectRestoreFailure(error: unknown): SaveFailure;
  prepareReset(): symbol | null;
  reset: (snapshot: Snapshot, options?: SaveResetOptions) => SaveResetResult;
}

type ReadResult =
  | { ok: true; value: SavedRecord | null; raw: string | null; backup: boolean }
  | { ok: false; status: 'read-error' | 'corrupt' | 'unsupported'; error: unknown; raw?: string | null };

const isRecord = (value: unknown): value is SavedRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * One save slot, with an explicit read gate: an unread or damaged save must not
 * be replaced by the fresh in-memory game that exists before loading finishes.
 */
export function createSaveStorage<Snapshot extends object = SavedRecord>(options: SaveStorageOptions): SaveStorage<Snapshot>;
export function createSaveStorage<Snapshot extends object = SavedRecord>({
  key,
  getStorage = () => globalThis.localStorage,
  decode = value => value,
  canWrite = () => true,
  migrationBackup,
}: Partial<SaveStorageOptions> = {}): SaveStorage<Snapshot> {
  if (typeof key !== 'string' || !key) throw new TypeError('A save key is required');
  const storageKey = key;
  if (migrationBackup && (!migrationBackup.key || migrationBackup.key === key)) {
    throw new TypeError('A migration backup needs a separate storage key');
  }
  let status: SaveStorageStatus = 'unread';
  let protectedSave = true;
  let resetConfirmation: symbol | null = null;
  let expectedRaw: string | null | undefined;
  let backupRaw: string | null = null;

  function protect(nextStatus: SaveStorageStatus, error: unknown): SaveFailure {
    status = nextStatus;
    protectedSave = true;
    resetConfirmation = null;
    return { ok: false, status, error };
  }

  function checkSession(): SaveFailure | null {
    try {
      if (canWrite()) return null;
      return protect('session-blocked', new Error('This game does not own the save session'));
    } catch (error) { return protect('session-blocked', error); }
  }

  function checkBaseline(backend: SaveStorageBackend): SaveFailure | null {
    // This detects old clients/external edits. It is not an atomic localStorage CAS;
    // cooperating browser sessions also need the exclusive Web Lock above.
    if (expectedRaw !== undefined && backend.getItem(storageKey) !== expectedRaw) {
      return protect('conflict', new Error('Saved progress changed in another session'));
    }
    return null;
  }

  function read(): ReadResult {
    let raw;
    try {
      raw = getStorage().getItem(storageKey);
    } catch (error) {
      return { ok: false, status: 'read-error', error };
    }
    if (raw === null) return { ok: true, value: null, raw, backup: false };
    try {
      const original: unknown = JSON.parse(raw);
      const value = decode(original);
      if (!isRecord(value)) throw new TypeError('Saved progress must be an object');
      return { ok: true, value, raw, backup: migrationBackup?.needed(original) ?? false };
    } catch (error) {
      return { ok: false, status: error instanceof UnsupportedSaveVersionError ? 'unsupported' : 'corrupt', error, raw };
    }
  }

  function load(): SaveLoadResult {
    const sessionError = checkSession();
    if (sessionError) return sessionError;
    const loaded = read();
    resetConfirmation = null;
    expectedRaw = loaded.raw;
    backupRaw = loaded.ok && loaded.backup ? loaded.raw : null;
    protectedSave = !loaded.ok;
    status = loaded.ok ? 'ready' : loaded.status;
    return loaded.ok ? { ok: true, status, value: loaded.value } : { ok: false, status, error: loaded.error };
  }

  function save(snapshot: Snapshot): SaveWriteResult {
    const sessionError = checkSession();
    if (sessionError) return sessionError;
    if (protectedSave) return { ok: false, status, blocked: true };
    try {
      const backend = getStorage();
      const conflict = checkBaseline(backend);
      if (conflict) return conflict;
      if (!isRecord(snapshot)) throw new TypeError('Progress must be an object');
      const serialized = JSON.stringify(snapshot);
      // Serialization can fail or a custom toJSON can return a non-record.
      if (typeof serialized !== 'string' || serialized[0] !== '{') throw new TypeError('Progress must serialize to an object');
      const lostBeforeBackup = checkSession();
      if (lostBeforeBackup) return lostBeforeBackup;
      if (backupRaw !== null && migrationBackup) {
        // Keep the original bytes once per schema target. A quota/access failure
        // must leave the original campaign untouched and allow a safe retry.
        if (backend.getItem(migrationBackup.key) === null) backend.setItem(migrationBackup.key, backupRaw);
      }
      const changedDuringBackup = checkBaseline(backend);
      if (changedDuringBackup) return changedDuringBackup;
      const lostSession = checkSession();
      if (lostSession) return lostSession;
      backend.setItem(storageKey, serialized);
      expectedRaw = serialized;
      backupRaw = null;
      status = 'ready';
      return { ok: true, status };
    } catch (error) {
      status = 'write-error';
      return { ok: false, status, error };
    }
  }

  function retry(snapshot: Snapshot): SaveRetryResult {
    const sessionError = checkSession();
    if (sessionError) return sessionError;
    if (!protectedSave) return save(snapshot);
    const loaded = read();
    if (!loaded.ok) {
      status = loaded.status;
      return { ok: false, status, error: loaded.error };
    }
    // The caller reloads/restores before resuming. Background timers may still
    // call save before navigation, so a successful retry must retain the gate.
    return { ok: true, status, value: loaded.value, needsRestore: true };
  }

  function prepareReset(): symbol | null {
    if (checkSession() || ['conflict', 'unsupported', 'session-blocked'].includes(status)) return null;
    resetConfirmation = protectedSave ? Symbol('confirmed-save-reset') : null;
    return resetConfirmation;
  }

  function reset(snapshot: Snapshot, { confirmation }: SaveResetOptions = {}): SaveResetResult {
    const sessionError = checkSession();
    if (sessionError) return sessionError;
    if (['conflict', 'unsupported', 'session-blocked'].includes(status)) return { ok: false, status, blocked: true };
    if (protectedSave && (resetConfirmation === null || confirmation !== resetConfirmation)) {
      return { ok: false, status, blocked: true, needsConfirmation: true };
    }
    if (expectedRaw === undefined) {
      // An earlier read failure cannot authorize destroying a now-readable
      // campaign (especially a future format) using an old confirmation token.
      const current = read();
      expectedRaw = current.raw;
      if (!current.ok) return protect(current.status, current.error);
      if (current.value !== null) return protect('conflict', new Error('Saved progress became available; reload before resetting'));
    }
    resetConfirmation = null;
    // Explicit reset authorizes replacing these known bytes even if corrupt.
    // If writing fails, subsequent retries may save the new current snapshot.
    protectedSave = false;
    return save(snapshot);
  }

  function checkForUpdates(): SaveWriteResult {
    const sessionError = checkSession();
    if (sessionError) return sessionError;
    if (protectedSave) return { ok: false, status, blocked: true };
    try {
      return checkBaseline(getStorage()) ?? { ok: true, status };
    } catch (error) { return protect('read-error', error); }
  }

  function protectRestoreFailure(error: unknown): SaveFailure {
    return protect('corrupt', error);
  }

  return {
    get status() { return status; },
    load, save, retry, checkForUpdates, protectRestoreFailure, prepareReset, reset,
  };
}
