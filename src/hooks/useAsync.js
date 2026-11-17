import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `loader(key)` (a function returning a Promise) and tracks the result.
 *
 *   const { data, loading, error, reload } = useAsync(fetchProductPage, productId)
 *
 * Re-runs when `key` changes or `reload()` is called. Results that arrive
 * after the key has changed are ignored. `loader` must be a stable function
 * (e.g. imported from a service file). Pass a null/undefined key to skip.
 */
export default function useAsync(loader, key) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ token: null, data: undefined, error: null })
  const token = `${key}#${attempt}`

  useEffect(() => {
    if (key == null) return undefined
    let cancelled = false
    loader(key).then(
      (data) => !cancelled && setState({ token, data, error: null }),
      (error) => !cancelled && setState({ token, data: undefined, error }),
    )
    return () => {
      cancelled = true
    }
  }, [loader, key, token])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const isCurrent = state.token === token

  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : null,
    loading: key != null && !isCurrent,
    reload,
  }
}
