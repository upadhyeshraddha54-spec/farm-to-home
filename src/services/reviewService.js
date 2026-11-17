import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { ORDER_STATUS } from '../utils/constants'

/*
 * Reviews live at products/{productId}/reviews/{customerUid} — one per
 * customer per product. The security rules only accept a review when the
 * named order belongs to that customer, contains the product, and the farm's
 * shipment was delivered ("verified purchase").
 *
 * Review: { productId, farmerId, orderId, rating (1–5), comment, customerName,
 *           createdAt, updatedAt }
 */

const REVIEWS_LIMIT = 2000
const toDoc = (snap) => ({ id: snap.id, ...snap.data() })

// Ratings are decoration: the store must still work if reviews can't be read
// (e.g. the live project has older security rules or the collection-group
// index is still building). These errors fall back to "no reviews".
const SOFT_ERROR_CODES = new Set(['permission-denied', 'failed-precondition', 'unavailable'])

/** Resolves to [] instead of throwing for recoverable read errors. */
export async function reviewsOrNone(promise) {
  try {
    return await promise
  } catch (error) {
    if (!SOFT_ERROR_CODES.has(error?.code)) throw error
    console.warn(
      `[reviews] Ratings unavailable (${error.code}). ` +
        'Deploy the latest firestore.rules and firestore.indexes.json to enable them.',
    )
    return []
  }
}
const byNewest = (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)

/** Public display name: first name plus last initial, e.g. "Asha P.". */
export function reviewerDisplayName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Customer'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

/** All reviews of one product, newest first. */
export async function fetchProductReviews(productId) {
  const snap = await getDocs(collection(db, 'products', productId, 'reviews'))
  return snap.docs.map(toDoc).sort(byNewest)
}

/** All reviews of one farm's products, newest first. */
export async function fetchFarmReviews(farmerId) {
  const snap = await getDocs(
    query(collectionGroup(db, 'reviews'), where('farmerId', '==', farmerId), limit(REVIEWS_LIMIT)),
  )
  return snap.docs.map(toDoc).sort(byNewest)
}

/** Every review in the store (for average ratings on cards). */
export async function fetchAllReviews() {
  const snap = await getDocs(query(collectionGroup(db, 'reviews'), limit(REVIEWS_LIMIT)))
  return snap.docs.map(toDoc)
}

/**
 * Finds an order of this customer in which `product` was delivered.
 * Returns the order ID, or null if they can't review the product yet.
 */
export async function findDeliveredOrderFor(customerId, product) {
  const snap = await getDocs(query(collection(db, 'orders'), where('customerId', '==', customerId)))
  const order = snap.docs
    .map(toDoc)
    .sort(byNewest)
    .find(
      (o) =>
        (o.quantities?.[product.id] ?? 0) > 0 &&
        o.fulfilment?.[product.farmerId]?.status === ORDER_STATUS.DELIVERED,
    )
  return order?.id ?? null
}

/** Creates (isNew) or updates the signed-in customer's review of a product. */
export function saveReview({ uid, product, orderId, customerName, rating, comment }, { isNew }) {
  const ref = doc(db, 'products', product.id, 'reviews', uid)
  if (isNew) {
    return setDoc(ref, {
      productId: product.id,
      farmerId: product.farmerId,
      orderId,
      rating,
      comment: comment.trim(),
      customerName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  return updateDoc(ref, { rating, comment: comment.trim(), updatedAt: serverTimestamp() })
}

export function deleteReview(productId, uid) {
  return deleteDoc(doc(db, 'products', productId, 'reviews', uid))
}
