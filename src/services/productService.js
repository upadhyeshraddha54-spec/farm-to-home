import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { formatFarmLocation } from './farmService'

// A function (not a constant) so nothing touches Firebase until it's used.
const productsRef = () => collection(db, 'products')

/** Newest first. Documents saved a moment ago may not have a timestamp yet. */
function byNewest(a, b) {
  const timeA = a.createdAt?.toMillis?.() ?? Date.now()
  const timeB = b.createdAt?.toMillis?.() ?? Date.now()
  return timeB - timeA
}

/**
 * Turns the product form values into the Firestore document shape.
 * Prices are rupees (numbers); stock is a whole number of units.
 */
function toProductData(values, farm) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category,
    price: Number(values.price),
    mrp: values.mrp === '' || values.mrp == null ? null : Number(values.mrp),
    unit: values.unit,
    stock: Number.parseInt(values.stock, 10),
    images: values.images.map(({ url, publicId }) => ({ url, publicId })),
    isActive: Boolean(values.isActive),
    farmName: farm.farmName,
    farmLocation: formatFarmLocation(farm),
    updatedAt: serverTimestamp(),
  }
}

/** Live list of one farmer's products (newest first). */
export function subscribeToFarmerProducts(farmerId, onData, onError) {
  const q = query(productsRef(), where('farmerId', '==', farmerId))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
    onError,
  )
}

/** One product, or null if it doesn't exist. */
export async function getProduct(productId) {
  const snap = await getDoc(doc(db, 'products', productId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createProduct(farmerId, farm, values) {
  const ref = await addDoc(productsRef(), {
    ...toProductData(values, farm),
    farmerId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export function updateProduct(productId, farm, values) {
  return updateDoc(doc(db, 'products', productId), toProductData(values, farm))
}

/** Show (true) or hide (false) a product from customers. */
export function setProductListed(productId, isActive) {
  return updateDoc(doc(db, 'products', productId), {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

export function deleteProduct(productId) {
  return deleteDoc(doc(db, 'products', productId))
}
