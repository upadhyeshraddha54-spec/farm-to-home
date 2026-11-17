import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/** "Nashik, Maharashtra" — stored on each product so listings can show it. */
export function formatFarmLocation(farm) {
  return [farm?.city, farm?.state].filter(Boolean).join(', ')
}

/** Live farm profile at farms/{farmerId}. Calls onData(farm | null). */
export function subscribeToFarm(farmerId, onData, onError) {
  return onSnapshot(
    doc(db, 'farms', farmerId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  )
}

/**
 * Creates or updates the farm profile.
 * If `syncProducts` is true, the farm name and location shown on all of this
 * farmer's products are updated in the same batch (all-or-nothing).
 */
export async function saveFarm(farmerId, values, { isNew, syncProducts }) {
  const farm = {
    farmName: values.farmName.trim(),
    city: values.city.trim(),
    state: values.state,
    description: values.description.trim(),
    updatedAt: serverTimestamp(),
  }
  if (isNew) farm.createdAt = serverTimestamp()

  const batch = writeBatch(db)
  batch.set(doc(db, 'farms', farmerId), farm, { merge: true })

  if (syncProducts) {
    const products = await getDocs(
      query(collection(db, 'products'), where('farmerId', '==', farmerId)),
    )
    products.forEach((productDoc) => {
      batch.update(productDoc.ref, {
        farmName: farm.farmName,
        farmLocation: formatFarmLocation(farm),
        updatedAt: serverTimestamp(),
      })
    })
  }

  await batch.commit()
}
