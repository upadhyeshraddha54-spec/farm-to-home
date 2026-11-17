import { DELIVERY_FEE_PAISE, FREE_DELIVERY_FROM_PAISE, ORDER_STATUS } from './constants'
import { formatPrice } from './formatters'

export const EMPTY_ADDRESS = Object.freeze({
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: 'Maharashtra',
  pincode: '',
})

// Order money is stored in whole paise (₹1 = 100 paise) so sums are exact.
// The same formulas are enforced in firestore.rules.

export const toPaise = (rupees) => Math.round(Number(rupees) * 100)

export function formatPaise(paise) {
  return formatPrice((Number(paise) || 0) / 100)
}

export function deliveryFeeFor(subtotalPaise) {
  return subtotalPaise >= FREE_DELIVERY_FROM_PAISE ? 0 : DELIVERY_FEE_PAISE
}

/** Totals for lines of { unitPricePaise, quantity }. */
export function calculateTotals(lines) {
  const subtotalPaise = lines.reduce((sum, l) => sum + l.unitPricePaise * l.quantity, 0)
  const deliveryFeePaise = lines.length ? deliveryFeeFor(subtotalPaise) : 0
  return { subtotalPaise, deliveryFeePaise, totalPaise: subtotalPaise + deliveryFeePaise }
}

/** The status of each farmer's part ("shipment") of an order. */
export function getShipmentStatuses(order) {
  return (order.farmerIds ?? []).map((id) => order.fulfilment?.[id]?.status ?? ORDER_STATUS.PLACED)
}

/**
 * One status for the whole order:
 * all parts the same → that status; all finished with at least one delivered
 * → delivered; otherwise "processing".
 */
export function getOverallStatus(order) {
  const statuses = getShipmentStatuses(order)
  if (!statuses.length) return ORDER_STATUS.PLACED
  if (statuses.every((s) => s === statuses[0])) return statuses[0]
  if (statuses.every((s) => s === ORDER_STATUS.DELIVERED || s === ORDER_STATUS.CANCELLED)) {
    return ORDER_STATUS.DELIVERED
  }
  return 'processing'
}

/** Customers may cancel only while no farmer has confirmed their part yet. */
export function canCustomerCancel(order) {
  const statuses = getShipmentStatuses(order)
  return statuses.length > 0 && statuses.every((s) => s === ORDER_STATUS.PLACED)
}

/** This farmer's lines and their value. */
export function getFarmerPart(order, farmerId) {
  const items = (order.items ?? []).filter((item) => item.farmerId === farmerId)
  return {
    items,
    status: order.fulfilment?.[farmerId]?.status ?? ORDER_STATUS.PLACED,
    timestamps: order.fulfilment?.[farmerId] ?? {},
    subtotalPaise: items.reduce((sum, item) => sum + item.lineTotalPaise, 0),
    units: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

/** Groups an order's items by farm, in the order farmers appear. */
export function groupItemsByFarm(order) {
  return (order.farmerIds ?? []).map((farmerId) => {
    const part = getFarmerPart(order, farmerId)
    return { farmerId, farmName: part.items[0]?.farmName ?? 'Farm', ...part }
  })
}

/**
 * The delivery fee is paid with shipment 1 (the first farm in the order).
 * If that shipment is cancelled, the fee isn't charged.
 */
export function collectsDeliveryFee(order, farmerId) {
  return order.deliveryFeePaise > 0 && order.farmerIds?.[0] === farmerId
}

/** Short, readable order number from the Firestore ID. */
export function shortOrderId(orderId = '') {
  return orderId.slice(0, 8).toUpperCase()
}

export function orderTime(order) {
  return order.createdAt?.toMillis?.() ?? 0
}

export function byNewestOrder(a, b) {
  return orderTime(b) - orderTime(a)
}
