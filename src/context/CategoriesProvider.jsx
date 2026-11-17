import { useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { ensureDefaultCategories, subscribeToCategories } from '../services/categoryService'
import { DEFAULT_CATEGORIES, setCategoryRegistry } from '../utils/constants'
import { CategoriesContext } from './categoriesContext'

const RETRY_DELAYS_MS = [2000, 5000, 15000]

/** Loads product categories once (live) and shares them with the whole app. */
export default function CategoriesProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({ categories: [], loading: true, error: null })
  const seededRef = useRef(false)

  useEffect(
    () =>
      subscribeToCategories(
        (categories) => {
          setCategoryRegistry(categories)
          setState({ categories, loading: false, error: null })
        },
        (error) => setState((prev) => ({ ...prev, loading: false, error })),
      ),
    [],
  )

  // A brand-new (or partly set-up) store lacks default categories, which would
  // stop farmers from listing anything. A signed-in visitor creates the missing
  // defaults (only until the store is marked as seeded — see
  // ensureDefaultCategories, so admins' deletions stick); the live subscription
  // picks them up. Failed attempts are retried a few times with backoff.
  const uid = user?.uid
  const defaultsMissing =
    !state.loading &&
    !state.error &&
    DEFAULT_CATEGORIES.some((d) => !state.categories.some((c) => c.value === d.value))

  useEffect(() => {
    if (!uid || !defaultsMissing || seededRef.current === uid) return
    seededRef.current = uid // one seeding run per signed-in user per session
    let cancelled = false
    let timer

    const attempt = (n) => {
      ensureDefaultCategories().catch((error) => {
        if (cancelled) return
        console.warn('[categories] Could not create default categories:', error?.code ?? error)
        if (n < RETRY_DELAYS_MS.length) timer = setTimeout(() => attempt(n + 1), RETRY_DELAYS_MS[n])
        else seededRef.current = null // give up for now; a later change can try again
      })
    }
    attempt(0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (seededRef.current === uid) seededRef.current = null
    }
  }, [uid, defaultsMissing])

  const value = useMemo(
    () => ({
      ...state,
      activeCategories: state.categories.filter((c) => c.isActive),
    }),
    [state],
  )

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}
