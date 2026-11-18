import {
  collection,
  doc,
  documentId,
  FieldPath,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { MAX_ORDER_ITEMS, ORDER_STATUS } from '../utils/constants'
import { byNewestOrder, calculateTotals, toPaise } from '../utils/orders'
import { t } from '../i18n'

/*
 * Order document (orders/{orderId}):
 * {
 *   customerId, customerEmail,
 *   address: { fullName, phone, line1, line2, landmark, city, state, pincode },
 *   items: [{ productId, farmerId, farmName, name, unit, image,
 *             unitPricePaise, quantity, lineTotalPaise }],      // max 8
 *   quantities: { [productId]: quantity },
 *   itemFarmerIds: [farmerId of each item, in the same order],
 *   farmerIds: [uid, ...],                                       // one per farm
 *   fulfilment: { [farmerId]: { status, placedAt, confirmedAt?, shippedAt?,
 *                               deliveredAt?, cancelledAt? } },
 *   subtotalPaise, deliveryFeePaise, totalPaise, paymentMethod: 'cod',
 *   createdAt, updatedAt
 * }
 * Every field is validated by firestore.rules, including prices and stock.
 */

const ordersRef = () => collection(db, 'orders')
const toDoc = (snap) => ({ id: snap.id, ...snap.data() })

/** Thrown when the cart can't be ordered as it is. `problems` lists why. */
export class CheckoutError extends Error {
  constructor(message, problems = []) {
    super(message)
    this.name = 'CheckoutError'
    this.problems = problems // [{ productId, name, type: 'unavailable'|'stock', available }]
  }
}

/** A fresh, unused order ID — created once per checkout to prevent duplicates. */
export function newOrderId() {
  return doc(ordersRef()).id
}

/**
 * Current details of the products in a cart (listed products only).
 * Returns a Map productId → product; missing IDs are unavailable.
 */
export async function fetchCartProducts(productIds) {
  const result = new Map()
  if (!productIds.length) return result
  const snap = await getDocs(
    query(
      collection(db, 'products'),
      where(documentId(), 'in', productIds.slice(0, MAX_ORDER_ITEMS)),
      where('isActive', '==', true),
    ),
  )
  snap.docs.forEach((d) => result.set(d.id, toDoc(d)))
  return result
}

/**
 * Places a Cash-on-Delivery order in ONE transaction:
 * re-reads every product, checks it is listed and in stock, writes the order
 * and reduces stock. Firestore retries the transaction if stock changes
 * meanwhile, so two buyers can never both get the last unit.
 *
 * Idempotent: calling it again with the same `orderId` (double click, network
 * retry) returns the existing order instead of creating a second one.
 */
export async function placeOrder({ orderId, address, cartItems }) {
  const user = auth.currentUser
  if (!user) throw new CheckoutError(t('Please sign in to place your order.'))
  if (!cartItems.length) throw new CheckoutError(t('Your cart is empty.'))
  if (cartItems.length > MAX_ORDER_ITEMS) {
    throw new CheckoutError(t('An order can contain up to {count} different products.', { count: MAX_ORDER_ITEMS }))
  }

  const orderRef = doc(db, 'orders', orderId)

  return runTransaction(db, async (tx) => {
    const existing = await tx.get(orderRef)
    if (existing.exists()) {
      if (existing.data().customerId === user.uid) return { orderId, alreadyPlaced: true }
      throw new CheckoutError(t('This checkout has expired. Please refresh the page and try again.'))
    }

    // Read every product inside the transaction.
    const products = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const snap = await tx.get(doc(db, 'products', item.productId))
          return snap.exists() ? toDoc(snap) : null
        } catch (error) {
          if (error?.code === 'permission-denied') return null // hidden by its farmer/admin
          throw error
        }
      }),
    )

    const problems = []
    cartItems.forEach((item, index) => {
      const product = products[index]
      if (!product || !product.isActive) {
        problems.push({ productId: item.productId, type: 'unavailable' })
      } else if (product.stock < item.quantity) {
        problems.push({
          productId: item.productId,
          name: product.name,
          type: 'stock',
          available: product.stock,
        })
      }
    })
    if (problems.length) {
      throw new CheckoutError(t('Some items in your cart changed. Please review your cart.'), problems)
    }

    const items = cartItems.map((item, index) => {
      const product = products[index]
      const unitPricePaise = toPaise(product.price)
      return {
        productId: product.id,
        farmerId: product.farmerId,
        farmName: product.farmName,
        name: product.name,
        unit: product.unit,
        image: product.images?.[0]?.url ?? '',
        unitPricePaise,
        quantity: item.quantity,
        lineTotalPaise: unitPricePaise * item.quantity,
      }
    })
    const farmerIds = [...new Set(items.map((item) => item.farmerId))]
    const fulfilment = Object.fromEntries(
      farmerIds.map((id) => [id, { status: ORDER_STATUS.PLACED, placedAt: serverTimestamp() }]),
    )

    tx.set(orderRef, {
      customerId: user.uid,
      customerEmail: user.email,
      address,
      items,
      // productId → quantity: lets the rules check each stock change cheaply
      quantities: Object.fromEntries(items.map((item) => [item.productId, item.quantity])),
      itemFarmerIds: items.map((item) => item.farmerId), // parallel to items (for the rules)
      farmerIds,
      fulfilment,
      ...calculateTotals(items),
      paymentMethod: 'cod',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    items.forEach((item, index) => {
      tx.update(doc(db, 'products', item.productId), {
        stock: products[index].stock - item.quantity,
        lastOrderId: orderId,
      })
    })
    return { orderId, alreadyPlaced: false }
  })
}

// ---------- Reading orders ----------

function subscribeToOrderList(q, onData, onError) {
  return onSnapshot(q, (snap) => onData(snap.docs.map(toDoc).sort(byNewestOrder)), onError)
}

/** A customer's own orders, newest first. */
export function subscribeToCustomerOrders(customerId, onData, onError) {
  return subscribeToOrderList(query(ordersRef(), where('customerId', '==', customerId)), onData, onError)
}

/** Orders that contain at least one of this farmer's products. */
export function subscribeToFarmerOrders(farmerId, onData, onError) {
  return subscribeToOrderList(
    query(ordersRef(), where('farmerIds', 'array-contains', farmerId)),
    onData,
    onError,
  )
}

/** Admin: the most recent orders. */
export function subscribeToRecentOrders(maxOrders, onData, onError) {
  return subscribeToOrderList(
    query(ordersRef(), orderBy('createdAt', 'desc'), limit(maxOrders)),
    onData,
    onError,
  )
}

/** One order, live. Calls onData(null) if it doesn't exist or isn't yours. */
export function subscribeToOrder(orderId, onData, onError) {
  return onSnapshot(
    doc(db, 'orders', orderId),
    (snap) => onData(snap.exists() ? toDoc(snap) : null),
    (error) => (error?.code === 'permission-denied' ? onData(null) : onError(error)),
  )
}

// ---------- Changing status ----------

function partField(farmerId, field) {
  return new FieldPath('fulfilment', farmerId, field)
}

/**
 * Moves farmers' parts of an order to a new status. Cancelling a part puts
 * its stock back, in the same transaction (the rules require exactly that).
 * `farmerIds`: which parts to change. Products that were deleted meanwhile
 * are skipped; products the user can't read are restocked "blind".
 */
export async function updateShipmentStatus(orderId, farmerIds, status) {
  const orderRef = doc(db, 'orders', orderId)
  const run = (skipUnreadable) =>
    runTransaction(db, async (tx) => {
      const snap = await tx.get(orderRef)
      if (!snap.exists()) throw new Error(t('Order not found.'))
      const order = snap.data()

      // Work out restocks before writing anything (transactions read first).
      const restock = []
      if (status === ORDER_STATUS.CANCELLED) {
        const items = order.items.filter((item) => farmerIds.includes(item.farmerId))
        for (const item of items) {
          try {
            const productSnap = await tx.get(doc(db, 'products', item.productId))
            if (productSnap.exists()) restock.push(item)
          } catch (error) {
            if (error?.code !== 'permission-denied') throw error
            if (!skipUnreadable) restock.push(item) // probably hidden, not deleted
          }
        }
      }

      const updates = [new FieldPath('updatedAt'), serverTimestamp()]
      farmerIds.forEach((farmerId) => {
        updates.push(partField(farmerId, 'status'), status)
        updates.push(partField(farmerId, `${status}At`), serverTimestamp())
      })
      tx.update(orderRef, ...updates)

      restock.forEach((item) => {
        tx.update(doc(db, 'products', item.productId), {
          stock: increment(item.quantity),
          lastOrderId: orderId,
        })
      })
    })

  try {
    await run(false)
  } catch (error) {
    // A product we couldn't read had actually been deleted — retry without it.
    if (status === ORDER_STATUS.CANCELLED && error?.code === 'not-found') {
      await run(true)
    } else {
      throw error
    }
  }
}

/** Customer: cancel the whole order (only while nothing is confirmed). */
export function cancelOrder(order) {
  return updateShipmentStatus(order.id, order.farmerIds, ORDER_STATUS.CANCELLED)
}
