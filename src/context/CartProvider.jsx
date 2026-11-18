import { useCallback, useEffect, useMemo, useState } from 'react'
import { MAX_ITEM_QUANTITY, MAX_ORDER_ITEMS } from '../utils/constants'
import { CartContext } from './cartContext'
import { t } from '../i18n'

const STORAGE_KEY = 'fth-cart-v1'

/**
 * The cart only stores product IDs and quantities. Prices, names and stock
 * are always re-read from Firestore (and re-checked at checkout and by the
 * security rules), so a tampered cart can't change what anyone pays.
 */
function readStoredCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((i) => typeof i?.productId === 'string' && Number.isInteger(i.quantity) && i.quantity > 0)
      .slice(0, MAX_ORDER_ITEMS)
      .map((i) => ({ productId: i.productId, quantity: Math.min(i.quantity, MAX_ITEM_QUANTITY) }))
  } catch {
    return []
  }
}

function writeStoredCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Private mode / storage full: the cart still works for this page visit.
  }
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart)

  useEffect(() => writeStoredCart(items), [items])

  // Keep several open tabs in sync.
  useEffect(() => {
    function onStorage(event) {
      if (event.key === STORAGE_KEY) setItems(readStoredCart())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /**
   * Adds `quantity` units (capped by `maxQuantity`, e.g. the stock).
   * Returns { ok: true } or { ok: false, reason }.
   */
  const addItem = useCallback(
    (productId, quantity, maxQuantity = MAX_ITEM_QUANTITY) => {
      const limit = Math.min(maxQuantity, MAX_ITEM_QUANTITY)
      const existing = items.find((i) => i.productId === productId)
      if (!existing && items.length >= MAX_ORDER_ITEMS) {
        return {
          ok: false,
          reason: t('An order can contain up to {count} different products. Check out or remove an item first.', { count: MAX_ORDER_ITEMS }),
        }
      }
      const current = existing?.quantity ?? 0
      if (current >= limit) {
        return { ok: false, reason: t('You already have the maximum ({count}) of this item in your cart.', { count: limit }) }
      }
      const next = Math.min(current + quantity, limit)
      setItems((prev) =>
        existing
          ? prev.map((i) => (i.productId === productId ? { ...i, quantity: next } : i))
          : [...prev, { productId, quantity: next }],
      )
      return { ok: true, capped: current + quantity > limit, quantity: next }
    },
    [items],
  )

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, MAX_ITEM_QUANTITY)) }
          : i,
      ),
    )
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  /** Removes several products at once (e.g. after they were ordered). */
  const removeItems = useCallback((productIds) => {
    const remove = new Set(productIds)
    setItems((prev) => prev.filter((i) => !remove.has(i.productId)))
  }, [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      removeItems,
      getQuantity: (productId) => items.find((i) => i.productId === productId)?.quantity ?? 0,
    }),
    [items, addItem, setQuantity, removeItem, removeItems],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
