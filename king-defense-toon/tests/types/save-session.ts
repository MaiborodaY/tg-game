import { createSaveSession } from '../../save-session.ts';
import type { SaveSession, SaveSessionLockManager, SaveSessionStatus } from '../../save-session.ts';

export async function verifySaveSessionContracts(locks: LockManager): Promise<void> {
  const manager: SaveSessionLockManager = locks;
  const session: SaveSession = createSaveSession({ key: 'campaign', getLocks: () => manager });
  const status: SaveSessionStatus = session.status;
  const pending: Promise<boolean> = session.acquire();
  const owned: boolean = await pending;
  const canWrite: boolean = session.canWrite;
  const error: unknown = session.error;
  session.release();
  createSaveSession({ key: 'campaign', getLocks: () => undefined });
  createSaveSession({ key: 'campaign', getLocks: () => null });

  // @ts-expect-error The slot key is mandatory.
  createSaveSession();
  // @ts-expect-error Slot names must be strings.
  createSaveSession({ key: 1 });
  // @ts-expect-error A save session needs an actual lock request method.
  createSaveSession({ key: 'campaign', getLocks: () => ({}) });
  // @ts-expect-error Acquiring a browser lock is asynchronous.
  const immediate: boolean = session.acquire();
  // @ts-expect-error External callers cannot claim ownership by changing status.
  session.status = 'owned';
  // @ts-expect-error Write permission is derived from the actual lock.
  session.canWrite = true;
  // @ts-expect-error A thrown API failure is not necessarily an Error object.
  const knownError: Error = session.error;
  void [status, owned, canWrite, error, immediate, knownError];
}
