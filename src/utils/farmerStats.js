import { LOW_STOCK_THRESHOLD, ORDER_STATUS } from './constants'
import { getFarmerPart } from './orders'

/** Counts for the dashboard product cards. */
export function getProductStats(products = []) {
  return {
    total: products.length,
    listed: products.filter((p) => p.isActive).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
  }
}

/** Products that are low or out of stock, lowest stock first. */
export function getLowStockProducts(products = []) {
  return products
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
}

const OPEN_STATUSES = [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED]

/**
 * Sales figures for ONE farmer from real orders. Only this farmer's part of
 * each order counts — an order can contain items from several farms.
 * Revenue and units sold count delivered parts only (Cash on Delivery is
 * collected on delivery).
 */
export function getSalesStats(orders = [], farmerId) {
  let revenuePaise = 0
  let unitsSold = 0
  let openOrders = 0
  let newOrders = 0
  let totalOrders = 0
  let last30DaysPaise = 0
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000

  orders.forEach((order) => {
    const part = getFarmerPart(order, farmerId)
    if (part.status === ORDER_STATUS.CANCELLED) return
    totalOrders += 1
    if (OPEN_STATUSES.includes(part.status)) openOrders += 1
    if (part.status === ORDER_STATUS.PLACED) newOrders += 1
    if (part.status === ORDER_STATUS.DELIVERED) {
      revenuePaise += part.subtotalPaise
      unitsSold += part.units
      const deliveredAt = part.timestamps.deliveredAt?.toMillis?.() ?? 0
      if (deliveredAt >= since) last30DaysPaise += part.subtotalPaise
    }
  })

  return { revenuePaise, unitsSold, openOrders, newOrders, totalOrders, last30DaysPaise }
}

/** Best sellers by units in non-cancelled orders: [{ productId, name, units, revenuePaise }]. */
export function getTopProducts(orders = [], farmerId, max = 5) {
  const byProduct = new Map()
  orders.forEach((order) => {
    const part = getFarmerPart(order, farmerId)
    if (part.status === ORDER_STATUS.CANCELLED) return
    part.items.forEach((item) => {
      const entry = byProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        units: 0,
        revenuePaise: 0,
      }
      entry.units += item.quantity
      if (part.status === ORDER_STATUS.DELIVERED) entry.revenuePaise += item.lineTotalPaise
      byProduct.set(item.productId, entry)
    })
  })
  return [...byProduct.values()].sort((a, b) => b.units - a.units).slice(0, max)
}
