import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getLanguage, localized } from '../i18n'

/*
 * Hindi/Marathi names for things whose name is copied onto other documents:
 * the farm name on products and orders, and product names on orders.
 * Those copies are stored in the language the farmer typed, so the current
 * translation is looked up from the farm / product itself.
 * Lookups are best-effort: if anything fails, the stored name is shown.
 */

const farms = new Map() // farmerId → farm doc (with translations)
let farmsPromise = null

export function rememberFarms(list) {
  list.forEach((farm) => farm?.id && farms.set(farm.id, farm))
}

/** Loads all farms once per visit (farms are public and few). */
export function loadFarmNames() {
  if (!farmsPromise) {
    farmsPromise = getDocs(collection(db, 'farms'))
      .then((snap) => rememberFarms(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {
        farmsPromise = null // try again next time
      })
  }
  return farmsPromise
}

/** A farm's name in the current language, falling back to the stored name. */
export function getFarmName(farmerId, storedName) {
  if (getLanguage() === 'en') return storedName
  const farm = farms.get(farmerId)
  return (farm && localized(farm, 'farmName')) || storedName
}

const products = new Map() // productId → product doc, or null if unreadable

/** Loads the given products (for their translated names), skipping known ones. */
export function loadProductNames(ids) {
  const missing = [...new Set(ids)].filter((id) => id && !products.has(id))
  return Promise.all(
    missing.map((id) =>
      getDoc(doc(db, 'products', id))
        .then((snap) => products.set(id, snap.exists() ? { id, ...snap.data() } : null))
        .catch(() => products.set(id, null)),
    ),
  ).then(() => missing.length > 0)
}

/** A product's name in the current language, falling back to the stored name. */
export function getProductName(productId, storedName) {
  if (getLanguage() === 'en') return storedName
  const product = products.get(productId)
  return (product && localized(product, 'name')) || storedName
}
