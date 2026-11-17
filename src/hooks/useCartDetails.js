import { useMemo } from 'react'
import { fetchCartProducts } from '../services/orderService'
import { calculateTotals, toPaise } from '../utils/orders'
import useAsync from './useAsync'
import useCart from './useCart'

const loadProducts = (key) => fetchCartProducts(key.split(','))

/**
 * Cart lines joined with live product data:
 * { lines: [{ productId, quantity, product, problem }], totals, hasProblems, loading, error, reload }
 * problem: null | 'unavailable' | 'out-of-stock' | 'too-many'
 */
export default function useCartDetails() {
  const { items } = useCart()
  const key = items.length ? items.map((i) => i.productId).sort().join(',') : null
  const { data, loading, error, reload } = useAsync(loadProducts, key)

  return useMemo(() => {
    const products = data ?? new Map()
    const lines = items.map((item) => {
      const product = products.get(item.productId) ?? null
      let problem = null
      if (!product) problem = 'unavailable'
      else if (product.stock <= 0) problem = 'out-of-stock'
      else if (item.quantity > product.stock) problem = 'too-many'
      return { ...item, product, problem }
    })
    const valid = lines.filter((l) => !l.problem)
    const totals = calculateTotals(
      valid.map((l) => ({ unitPricePaise: toPaise(l.product.price), quantity: l.quantity })),
    )
    return {
      lines,
      totals,
      units: valid.reduce((sum, l) => sum + l.quantity, 0),
      hasProblems: lines.some((l) => l.problem),
      loading: loading || (key != null && !data && !error),
      error,
      reload,
    }
  }, [items, data, loading, error, reload, key])
}
