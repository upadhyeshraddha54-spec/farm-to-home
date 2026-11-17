import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { DEFAULT_CATEGORIES } from '../utils/constants'

function toCategory(snap) {
  const data = snap.data()
  return {
    value: snap.id,
    label: data.label,
    emoji: data.emoji ?? '',
    isActive: data.isActive !== false,
    sortOrder: data.sortOrder ?? 0,
  }
}

function bySortOrder(a, b) {
  return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)
}

/** Live list of all categories (public), sorted for display. */
export function subscribeToCategories(onData, onError) {
  return onSnapshot(
    collection(db, 'categories'),
    (snap) => onData(snap.docs.map(toCategory).sort(bySortOrder)),
    onError,
  )
}

/** Admin: create (isNew) or update a category. */
export function saveCategory(slug, values, { isNew }) {
  const data = {
    label: values.label.trim(),
    emoji: (values.emoji ?? '').trim(),
    isActive: Boolean(values.isActive),
    sortOrder: Number.parseInt(values.sortOrder, 10) || 0,
    updatedAt: serverTimestamp(),
  }
  if (isNew) data.createdAt = serverTimestamp()
  return setDoc(doc(db, 'categories', slug), data, { merge: !isNew })
}

export function deleteCategory(slug) {
  return deleteDoc(doc(db, 'categories', slug))
}

// settings/categories marks that the defaults were created once. After that,
// only admins change categories, so their edits and deletions stick.
const seededMarkerRef = () => doc(db, 'settings', 'categories')

/**
 * Creates `ref` with `data` only if it does not exist yet; never overwrites.
 * A transaction makes the write conditional on the document still being
 * absent, so the rules see a `create` (never an `update`), and two clients
 * seeding at once can't clobber each other — the loser re-reads, sees the
 * document and skips. Resolves true if this call created it.
 */
function createIfMissing(ref, data) {
  return runTransaction(db, async (tx) => {
    if ((await tx.get(ref)).exists()) return false
    tx.set(ref, data)
    return true
  })
}

function defaultCategoryData(category, index) {
  return {
    label: category.label,
    emoji: category.emoji,
    isActive: true,
    sortOrder: index * 10, // must match isDefaultCategory() in firestore.rules
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

/**
 * Creates every default category that doesn't exist on the server, then the
 * marker. Existence is checked on the server per document (a caller's list
 * may be stale), so existing categories are never touched. Each category is
 * its own small write (one batch of eight exceeds the rules budget), and one
 * failure doesn't stop the others: everything that can be created is, then
 * the first error is thrown so the caller can retry — a retry only creates
 * what is still missing. Returns how many categories this call created.
 */
async function createMissingDefaults() {
  const results = await Promise.allSettled(
    DEFAULT_CATEGORIES.map((category, index) =>
      createIfMissing(doc(db, 'categories', category.value), defaultCategoryData(category, index)),
    ),
  )
  const failed = results.find((r) => r.status === 'rejected')
  if (failed) throw failed.reason
  // Only after all defaults exist (firestore.rules checks this too).
  await createIfMissing(seededMarkerRef(), { defaultsSeeded: true, seededAt: serverTimestamp() })
  return results.filter((r) => r.value === true).length
}

/**
 * Creates the default categories for a brand-new store, so farmers can list
 * products without an admin. Any signed-in user may do this (the rules allow
 * only the exact default set, and only before the marker exists). Safe to
 * call repeatedly and concurrently; after a partial failure, calling again
 * finishes the job. Returns how many categories were created (0 if already
 * seeded — admins' later edits and deletions are never undone).
 */
export async function ensureDefaultCategories() {
  const marker = await getDoc(seededMarkerRef())
  if (marker.exists()) return 0
  return createMissingDefaults()
}

/**
 * Admin: adds any of the default categories that don't exist yet (even after
 * seeding, e.g. to restore one that was deleted). Returns how many.
 */
export async function addMissingDefaultCategories() {
  return createMissingDefaults()
}

/** Admin: how many products use a category (any visibility). */
export async function countProductsInCategory(slug) {
  const snap = await getCountFromServer(
    query(collection(db, 'products'), where('category', '==', slug)),
  )
  return snap.data().count
}
