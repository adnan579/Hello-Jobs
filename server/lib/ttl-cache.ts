/**
 * A tiny in-process cache for data every visitor sees (the public job list and counters).
 * - Keyed by owner (the app context), so tests and separate apps never share entries.
 * - One query serves every request that arrives while it is loading ("single flight").
 * - ttlSec <= 0 turns caching off (development and tests stay exact).
 * Each serverless instance has its own copy, so a change shows up everywhere within ttlSec at most;
 * writes served by the same instance clear it immediately (see invalidate).
 */
interface Entry {
  value?: unknown;
  expires: number;
  pending?: Promise<unknown>;
}

const stores = new WeakMap<object, Map<string, Entry>>();
const MAX_KEYS = 50;

export async function cached<T>(owner: object, ttlSec: number, key: string, load: () => Promise<T>): Promise<T> {
  if (ttlSec <= 0) return load();
  let store = stores.get(owner);
  if (!store) {
    store = new Map();
    stores.set(owner, store);
  }
  const now = Date.now();
  const hit = store.get(key);
  if (hit?.pending) return hit.pending as Promise<T>;
  if (hit && hit.expires > now) return hit.value as T;

  if (!hit && store.size >= MAX_KEYS) store.clear(); // keys are a small fixed set; this is only a backstop
  const entry: Entry = { expires: 0 };
  const pending = load().then(
    (value) => {
      entry.value = value;
      entry.expires = Date.now() + ttlSec * 1000;
      entry.pending = undefined;
      return value;
    },
    (error) => {
      store!.delete(key);
      throw error;
    }
  );
  entry.pending = pending;
  store.set(key, entry);
  return pending;
}

/** Forget everything cached for this owner (called after any successful write). */
export function invalidate(owner: object): void {
  stores.get(owner)?.clear();
}
