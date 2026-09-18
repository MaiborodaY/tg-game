export type SaveStorageStatus = 'unread' | 'ready' | 'read-error' | 'corrupt' | 'write-error';
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
  prepareReset(): symbol | null;
  reset: (snapshot: Snapshot, options?: SaveResetOptions) => SaveResetResult;
}

type ReadResult =
  | { ok: true; value: SavedRecord | null }
  | { ok: false; status: 'read-error' | 'corrupt'; error: unknown };

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
}: Partial<SaveStorageOptions> = {}): SaveStorage<Snapshot> {
  if (typeof key !== 'string' || !key) throw new TypeError('A save key is required');
  const storageKey = key;
  let status: SaveStorageStatus = 'unread';
  let protectedSave = true;
  let resetConfirmation: symbol | null = null;

  function read(): ReadResult {
    let raw;
    try {
      raw = getStorage().getItem(storageKey);
    } catch (error) {
      return { ok: false, status: 'read-error', error };
    }
    if (raw === null) return { ok: true, value: null };
    try {
      const value = decode(JSON.parse(raw));
      if (!isRecord(value)) throw new TypeError('Saved progress must be an object');
      return { ok: true, value };
    } catch (error) {
      return { ok: false, status: 'corrupt', error };
    }
  }

  function load(): SaveLoadResult {
    const loaded = read();
    resetConfirmation = null;
    protectedSave = !loaded.ok;
    status = loaded.ok ? 'ready' : loaded.status;
    return loaded.ok ? { ok: true, status, value: loaded.value } : { ok: false, status, error: loaded.error };
  }

  function save(snapshot: Snapshot): SaveWriteResult {
    if (protectedSave) return { ok: false, status, blocked: true };
    try {
      if (!isRecord(snapshot)) throw new TypeError('Progress must be an object');
      const serialized = JSON.stringify(snapshot);
      // Serialization can fail or a custom toJSON can return a non-record.
      if (typeof serialized !== 'string' || serialized[0] !== '{') throw new TypeError('Progress must serialize to an object');
      getStorage().setItem(storageKey, serialized);
      status = 'ready';
      return { ok: true, status };
    } catch (error) {
      status = 'write-error';
      return { ok: false, status, error };
    }
  }

  function retry(snapshot: Snapshot): SaveRetryResult {
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
    resetConfirmation = protectedSave ? Symbol('confirmed-save-reset') : null;
    return resetConfirmation;
  }

  function reset(snapshot: Snapshot, { confirmation }: SaveResetOptions = {}): SaveResetResult {
    if (protectedSave && (resetConfirmation === null || confirmation !== resetConfirmation)) {
      return { ok: false, status, blocked: true, needsConfirmation: true };
    }
    resetConfirmation = null;
    // Explicit reset authorizes replacing this slot even if it was unreadable.
    // If writing fails, subsequent retries may save the new current snapshot.
    protectedSave = false;
    return save(snapshot);
  }

  return {
    get status() { return status; },
    load, save, retry, prepareReset, reset,
  };
}
