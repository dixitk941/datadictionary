import { useState, useEffect, useRef, useCallback } from 'react'
import { cache } from '../lib/cache'

/**
 * Data-fetching hook with smart caching.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useQuery(
 *     'connections',             // cache key
 *     () => getConnections(),    // fetcher (stable reference preferred)
 *     { ttl: 5 * 60_000 }       // options
 *   )
 *
 * Options:
 *   ttl      – cache lifetime in ms (default 60s)
 *   enabled  – set false to skip fetch (e.g. missing dependency)
 *   defaultData – value returned before first fetch
 */
export function useQuery(key, fetcher, { ttl = 60_000, enabled = true, defaultData = undefined } = {}) {
  const [data, setData] = useState(() => cache.get(key) ?? defaultData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Keep latest refs so stale closures don't bite us
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const keyRef = useRef(key)
  keyRef.current = key

  const run = useCallback(
    ({ invalidate = false } = {}) => {
      if (!enabled) return
      const k = keyRef.current
      if (invalidate) cache.invalidate(k)

      // Serve from cache instantly if fresh, still track that we're "loading"
      const fresh = cache.get(k)
      if (fresh !== undefined && !invalidate) {
        setData(fresh)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      cache
        .fetch(k, () => fetcherRef.current(), ttl)
        .then((d) => {
          if (keyRef.current === k) {
            setData(d)
            setLoading(false)
          }
        })
        .catch((e) => {
          if (keyRef.current === k) {
            setError(e.message ?? 'Request failed')
            setLoading(false)
          }
        })
    },
    [enabled, ttl]
  )

  useEffect(() => {
    if (!enabled) return
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  return { data: data ?? defaultData, loading, error, refetch: run }
}
