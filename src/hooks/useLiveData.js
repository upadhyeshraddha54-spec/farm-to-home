import { useEffect, useState } from 'react'

/**
 * Subscribes to live Firestore data and unsubscribes automatically.
 *
 *   const { data, loading, error } = useLiveData(subscribeToFarm, user.uid)
 *
 * `subscribe(key, onData, onError)` must return an unsubscribe function
 * (all our service `subscribeTo…` functions do). Pass a falsy `key` to skip.
 */
export default function useLiveData(subscribe, key) {
  const [state, setState] = useState({ key: null, data: undefined, error: null })

  useEffect(() => {
    if (!key) return undefined
    return subscribe(
      key,
      (data) => setState({ key, data, error: null }),
      (error) => setState({ key, data: undefined, error }),
    )
  }, [subscribe, key])

  // Ignore results that belong to a previous key.
  const isCurrent = Boolean(key) && state.key === key
  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : null,
    loading: Boolean(key) && !isCurrent,
  }
}
