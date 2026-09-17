const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * One save slot, with an explicit read gate: an unread or damaged save must not
 * be replaced by the fresh in-memory game that exists before loading finishes.
 */
export function createSaveStorage({
  key,
  getStorage = () => globalThis.localStorage,
  decode = value => value,
} = {}) {
  if (typeof key !== 'string' || !key) throw new TypeError('A save key is required');
  let status = 'unread';
  let protectedSave = true;
  let resetConfirmation = null;

  const result = (ok, extra = {}) => ({ ok, status, ...extra });

  function read() {
    let raw;
    try {
      raw = getStorage().getItem(key);
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

  function load() {
    const loaded = read();
    resetConfirmation = null;
    protectedSave = !loaded.ok;
    status = loaded.ok ? 'ready' : loaded.status;
    return result(loaded.ok, loaded.ok ? { value: loaded.value } : { error: loaded.error });
  }

  function save(snapshot) {
    if (protectedSave) return result(false, { blocked: true });
    try {
      if (!isRecord(snapshot)) throw new TypeError('Progress must be an object');
      const serialized = JSON.stringify(snapshot);
      // Serialization can fail or a custom toJSON can return a non-record.
      if (typeof serialized !== 'string' || serialized[0] !== '{') throw new TypeError('Progress must serialize to an object');
      getStorage().setItem(key, serialized);
      status = 'ready';
      return result(true);
    } catch (error) {
      status = 'write-error';
      return result(false, { error });
    }
  }

  function retry(snapshot) {
    if (!protectedSave) return save(snapshot);
    const loaded = read();
    if (!loaded.ok) {
      status = loaded.status;
      return result(false, { error: loaded.error });
    }
    // The caller reloads/restores before resuming. Background timers may still
    // call save before navigation, so a successful retry must retain the gate.
    return result(true, { value: loaded.value, needsRestore: true });
  }

  function prepareReset() {
    resetConfirmation = protectedSave ? Symbol('confirmed-save-reset') : null;
    return resetConfirmation;
  }

  function reset(snapshot, { confirmation } = {}) {
    if (protectedSave && (resetConfirmation === null || confirmation !== resetConfirmation)) {
      return result(false, { blocked: true, needsConfirmation: true });
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
