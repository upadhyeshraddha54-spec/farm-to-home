import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { attachRatings, ratingsByKey, summarizeReviews } from '../utils/reviews'
import { fetchAllReviews, fetchFarmReviews, fetchProductReviews, reviewsOrNone } from './reviewService'

/*
 * Read-only queries for the customer-facing store.
 *
 * "Visible" products are listed (isActive == true) AND in stock (stock > 0).
 * Suspending a farmer hides all their products, so every listed product
 * belongs to an active farmer. Products and farms carry a `rating`
 * ({ count, average }) computed from customer reviews.
 *
 * Firestore has no full-text search, so the catalogue is loaded once and
 * searched/filtered in the browser (see utils/marketplace.js). That is fast and
 * simple up to a few thousand products; a search service (e.g. Algolia or
 * Typesense) is the upgrade path after that.
 */

const CATALOG_LIMIT = 1000

const toDoc = (snap) => ({ id: snap.id, ...snap.data() })
const isInStock = (product) => Number(product.stock) > 0

function byNewest(a, b) {
  return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
}

/** Treat "missing" and "not allowed to see" the same: not found. */
async function getDocOrNull(path) {
  try {
    const snap = await getDoc(doc(db, path))
    return snap.exists() ? toDoc(snap) : null
  } catch (error) {
    if (error?.code === 'permission-denied') return null
    throw error
  }
}

/** All visible products, newest first (without ratings). */
async function loadVisibleProducts() {
  // The isActive filter is required by the security rules for public reads.
  const snap = await getDocs(
    query(collection(db, 'products'), where('isActive', '==', true), limit(CATALOG_LIMIT)),
  )
  return snap.docs.map(toDoc).filter(isInStock).sort(byNewest)
}

/** All visible products with ratings, newest first. */
export async function fetchCatalog() {
  const [products, reviews] = await Promise.all([loadVisibleProducts(), reviewsOrNone(fetchAllReviews())])
  return attachRatings(products, ratingsByKey(reviews, 'productId'))
}

/** Listed products of one farm (including out-of-stock ones). */
async function fetchListedFarmProducts(farmId) {
  const snap = await getDocs(
    query(
      collection(db, 'products'),
      where('farmerId', '==', farmId),
      where('isActive', '==', true),
    ),
  )
  return snap.docs.map(toDoc).sort(byNewest)
}

/**
 * Farms that currently have at least one visible product,
 * each with `productCount`, `categories` and `rating`.
 */
function summariseFarms(farms, products, farmRatings) {
  const byFarm = new Map()
  products.forEach((product) => {
    const entry = byFarm.get(product.farmerId) ?? { count: 0, categories: new Set() }
    entry.count += 1
    entry.categories.add(product.category)
    byFarm.set(product.farmerId, entry)
  })
  return farms
    .filter((farm) => byFarm.has(farm.id))
    .map((farm) => ({
      ...farm,
      productCount: byFarm.get(farm.id).count,
      categories: [...byFarm.get(farm.id).categories],
      rating: farmRatings.get(farm.id) ?? { count: 0, average: 0 },
    }))
    .sort((a, b) => b.productCount - a.productCount || a.farmName.localeCompare(b.farmName))
}

/** Everything the home page and the farmers directory need. */
export async function fetchStorefront() {
  const [rawProducts, farmsSnap, reviews] = await Promise.all([
    loadVisibleProducts(),
    getDocs(collection(db, 'farms')),
    reviewsOrNone(fetchAllReviews()),
  ])
  const products = attachRatings(rawProducts, ratingsByKey(reviews, 'productId'))
  const farms = summariseFarms(farmsSnap.docs.map(toDoc), products, ratingsByKey(reviews, 'farmerId'))
  return { products, farms }
}

/**
 * Product page data. Returns null when the product doesn't exist or isn't
 * visible to this user. (Farmers can open their own hidden products.)
 */
export async function fetchProductPage(productId) {
  const product = await getDocOrNull(`products/${productId}`)
  if (!product) return null

  const [farm, farmProducts, reviews, similarSnap] = await Promise.all([
    getDocOrNull(`farms/${product.farmerId}`),
    fetchListedFarmProducts(product.farmerId),
    reviewsOrNone(fetchProductReviews(product.id)),
    getDocs(
      query(
        collection(db, 'products'),
        where('category', '==', product.category),
        where('isActive', '==', true),
        limit(24),
      ),
    ),
  ])

  const others = (list) => list.filter((p) => p.id !== product.id && isInStock(p))
  return {
    product: { ...product, rating: summarizeReviews(reviews) },
    reviews,
    farm,
    moreFromFarm: others(farmProducts).slice(0, 10),
    similar: others(similarSnap.docs.map(toDoc))
      .filter((p) => p.farmerId !== product.farmerId)
      .sort(byNewest)
      .slice(0, 10),
  }
}

/**
 * Public farm page. Only farms with at least one listed product are shown,
 * so suspended farmers (whose products are all hidden) don't get a public page.
 */
export async function fetchFarmPage(farmId) {
  const [farm, listed, reviews] = await Promise.all([
    getDocOrNull(`farms/${farmId}`),
    fetchListedFarmProducts(farmId),
    reviewsOrNone(fetchFarmReviews(farmId)),
  ])
  if (!farm || listed.length === 0) return null
  return {
    farm: { ...farm, rating: summarizeReviews(reviews) },
    products: attachRatings(listed.filter(isInStock), ratingsByKey(reviews, 'productId')),
    reviews,
  }
}
