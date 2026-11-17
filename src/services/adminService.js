import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { FARMER_STATUS } from '../utils/constants'

/*
 * Admin-only operations. The security rules check that the signed-in user is
 * an admin (users/{uid}.role == 'admin') for every one of these writes.
 */

const toDoc = (snap) => ({ id: snap.id, ...snap.data() })
const BATCH_LIMIT = 450

async function commitInChunks(refsAndData) {
  for (let i = 0; i < refsAndData.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    refsAndData.slice(i, i + BATCH_LIMIT).forEach(([ref, data]) => batch.update(ref, data))
    await batch.commit()
  }
}

// ---------- Users & farmers ----------

/** All user profiles, newest first. */
export function subscribeToUsers(onData, onError) {
  return onSnapshot(
    collection(db, 'users'),
    (snap) =>
      onData(
        snap.docs
          .map(toDoc)
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
      ),
    onError,
  )
}

/** All farm profiles as a Map farmerId → farm. */
export async function fetchFarmsById() {
  const snap = await getDocs(collection(db, 'farms'))
  return new Map(snap.docs.map((d) => [d.id, toDoc(d)]))
}

/**
 * Suspends or reinstates a farmer and keeps their listings in step:
 *  - suspended → every listed product is hidden (hiddenBy: 'suspension')
 *  - active    → products hidden by a suspension are listed again
 * Products an admin hid individually (hiddenBy: 'admin') are left alone.
 * Returns how many products changed.
 */
export async function setFarmerStatus(farmerId, status) {
  await updateDoc(doc(db, 'users', farmerId), {
    farmerStatus: status,
    statusUpdatedAt: serverTimestamp(),
  })

  const products = collection(db, 'products')
  let changes = []
  if (status === FARMER_STATUS.SUSPENDED) {
    const snap = await getDocs(
      query(products, where('farmerId', '==', farmerId), where('isActive', '==', true)),
    )
    changes = snap.docs.map((d) => [
      d.ref,
      { isActive: false, hiddenBy: 'suspension', updatedAt: serverTimestamp() },
    ])
  } else if (status === FARMER_STATUS.ACTIVE) {
    const snap = await getDocs(
      query(products, where('farmerId', '==', farmerId), where('hiddenBy', '==', 'suspension')),
    )
    changes = snap.docs.map((d) => [
      d.ref,
      { isActive: true, hiddenBy: deleteField(), updatedAt: serverTimestamp() },
    ])
  }
  await commitInChunks(changes)
  return changes.length
}

export function setCustomerBlocked(uid, blocked) {
  return updateDoc(doc(db, 'users', uid), { blocked, statusUpdatedAt: serverTimestamp() })
}

// ---------- Products ----------

/** Every product (listed or not), newest first. */
export function subscribeToAllProducts(onData, onError) {
  return onSnapshot(
    collection(db, 'products'),
    (snap) =>
      onData(
        snap.docs
          .map(toDoc)
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
      ),
    onError,
  )
}

/** Hide a product from the store (the farmer can't relist it) or release it. */
export function setProductHiddenByAdmin(productId, hidden) {
  return updateDoc(
    doc(db, 'products', productId),
    hidden
      ? { isActive: false, hiddenBy: 'admin', updatedAt: serverTimestamp() }
      : { isActive: true, hiddenBy: deleteField(), updatedAt: serverTimestamp() },
  )
}

export function deleteProductAsAdmin(productId) {
  return deleteDoc(doc(db, 'products', productId))
}

// ---------- Overview ----------

/** Headline counts for the admin overview (cheap server-side counts). */
export async function fetchAdminCounts() {
  const count = async (q) => (await getCountFromServer(q)).data().count
  const users = collection(db, 'users')
  const products = collection(db, 'products')
  const [customers, farmers, suspendedFarmers, admins, listedProducts, allProducts, orders, newMessages] =
    await Promise.all([
      count(query(users, where('role', '==', 'customer'))),
      count(query(users, where('role', '==', 'farmer'))),
      count(query(users, where('farmerStatus', '==', FARMER_STATUS.SUSPENDED))),
      count(query(users, where('role', '==', 'admin'))),
      count(query(products, where('isActive', '==', true))),
      count(products),
      count(collection(db, 'orders')),
      count(query(collection(db, 'messages'), where('status', '==', 'new'))),
    ])
  return {
    customers,
    farmers,
    suspendedFarmers,
    admins,
    listedProducts,
    hiddenProducts: allProducts - listedProducts,
    orders,
    newMessages,
  }
}

// ---------- Contact messages ----------

export function subscribeToMessages(onData, onError) {
  return onSnapshot(
    query(collection(db, 'messages'), orderBy('createdAt', 'desc')),
    (snap) => onData(snap.docs.map(toDoc)),
    onError,
  )
}

export function setMessageStatus(messageId, status) {
  return updateDoc(doc(db, 'messages', messageId), {
    status,
    resolvedAt: status === 'resolved' ? serverTimestamp() : null,
  })
}
