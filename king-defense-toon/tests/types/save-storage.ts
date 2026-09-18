import { createSaveStorage } from '../../save-storage.ts';
import type { SavedRecord, SaveStorage, SaveStorageBackend, SaveStorageStatus } from '../../save-storage.ts';
import { createHero } from '../../hero.ts';
import type { HeroState } from '../../hero.ts';

interface ProgressSnapshot {
  gold: number;
  hero: HeroState;
}

// A checked write contract never turns a partially validated read into live state.
export function verifySaveStorageContracts(backend: SaveStorageBackend, raw: unknown): void {
  const storage = createSaveStorage<ProgressSnapshot>({
    key: 'campaign', getStorage: () => backend, decode: value => value,
  });
  const snapshot: ProgressSnapshot = { gold: 125, hero: createHero(raw) };
  storage.save(snapshot);
  const status: SaveStorageStatus = storage.status;
  const loaded = storage.load();
  if (loaded.ok) {
    const value: SavedRecord | null = loaded.value;
    // @ts-expect-error An empty slot is represented by null.
    const present: SavedRecord = loaded.value;
    if (loaded.value) {
      // @ts-expect-error Top-level validation does not prove a numeric balance.
      const gold: number = loaded.value.gold;
      // @ts-expect-error The write generic does not assert a validated hero on read.
      const hero: HeroState = loaded.value.hero;
      createHero(loaded.value.hero);
      void [gold, hero];
    }
    void [value, present];
  } else {
    const error: unknown = loaded.error;
    // @ts-expect-error JavaScript can throw a string, null or any other value.
    const knownError: Error = loaded.error;
    // @ts-expect-error A failed load carries no recovered progress.
    loaded.value;
    void [error, knownError];
  }

  const retried = storage.retry(snapshot);
  if (retried.ok && 'needsRestore' in retried) {
    const restore: true = retried.needsRestore;
    const value: SavedRecord | null = retried.value;
    // @ts-expect-error A successful read retry has not opened the write gate.
    const ready: 'ready' = retried.status;
    void [restore, value, ready];
  }
  const confirmation: symbol | null = storage.prepareReset();
  const reset = storage.reset(snapshot, { confirmation });
  if (!reset.ok && 'needsConfirmation' in reset) {
    const blocked: true = reset.blocked;
    const required: true = reset.needsConfirmation;
    void [blocked, required];
  }
  const untyped = createSaveStorage({ key: 'other' }).load();
  if (untyped.ok && untyped.value) {
    // @ts-expect-error No decoder can imply a ready-to-use game snapshot.
    const progress: ProgressSnapshot = untyped.value;
    void progress;
  }

  // @ts-expect-error The key is required at the typed call boundary.
  createSaveStorage();
  // @ts-expect-error A storage slot must have a string key.
  createSaveStorage({ key: 1 });
  // @ts-expect-error A backend must support writes as well as reads.
  createSaveStorage({ key: 'campaign', getStorage: () => ({ getItem: () => null }) });
  // @ts-expect-error A decoder must handle unknown saved input, not assume gameplay state.
  createSaveStorage({ key: 'campaign', decode: (value: ProgressSnapshot) => value });
  // @ts-expect-error Writes require the complete chosen snapshot shape.
  storage.save({ gold: 125 });
  // @ts-expect-error A second reference cannot weaken the chosen write contract.
  const widened: SaveStorage<object> = storage;
  // @ts-expect-error A retry writes the same snapshot contract as a regular save.
  storage.retry({ gold: '125', hero: createHero() });
  // @ts-expect-error Raw saved input is not a normalized write snapshot.
  storage.reset(raw);
  // @ts-expect-error Reset confirmation is an opaque symbol, not a boolean.
  storage.reset(snapshot, { confirmation: true });
  // @ts-expect-error Storage status can only be changed by the adapter.
  storage.status = 'ready';
  void [status, widened];
}
