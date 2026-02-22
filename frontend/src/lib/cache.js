/**
 * Smart in-memory cache with:
 *  - TTL-based expiry
 *  - In-flight request deduplication (prevents waterfall fetches)
 *  - Prefix-based invalidation
 */

const store = new Map()    // key → { data, ts, ttl }
const inflight = new Map() // key → Promise (dedup)

export const cache = {
  /** Return cached data if still fresh, otherwise undefined */
  get(key) {
    const entry = store.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.ts > entry.ttl) {
      store.delete(key)
      return undefined
    }
    return entry.data
  },

  /** Store data with a TTL (ms) */
  set(key, data, ttl = 60_000) {
    store.set(key, { data, ts: Date.now(), ttl })
  },

  /** Delete all keys that start with `prefix` */
  invalidate(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key)
    }
    for (const key of inflight.keys()) {
      if (key.startsWith(prefix)) inflight.delete(key)
    }
  },

  /**
   * Fetch with cache + deduplication.
   * If data is fresh → returns immediately.
   * If another fetch for the same key is in-flight → joins that promise.
   * Otherwise → calls fetcher(), caches result.
   */
  async fetch(key, fetcher, ttl = 60_000) {
    const cached = this.get(key)
    if (cached !== undefined) return cached

    if (inflight.has(key)) return inflight.get(key)

    const promise = fetcher()
      .then((data) => {
        this.set(key, data, ttl)
        inflight.delete(key)
        return data
      })
      .catch((err) => {
        inflight.delete(key)
        throw err
      })

    inflight.set(key, promise)
    return promise
  },

  /** Wipe everything (e.g. on logout) */
  clear() {
    store.clear()
    inflight.clear()
  },
}
