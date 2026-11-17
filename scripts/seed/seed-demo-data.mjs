#!/usr/bin/env node
/**
 * Farm To Home — demo data seeder (Firebase Admin SDK)
 *
 *   npm run seed:demo                       Preview what would change (no writes)
 *   npm run seed:demo -- --write            Create / refresh the demo farms and products
 *   npm run seed:demo -- --remove           Preview what would be removed
 *   npm run seed:demo -- --remove --write   Remove all demo farms and products
 *
 * Safety:
 *  - Nothing is written unless you pass --write.
 *  - Only touches documents whose ID starts with "demo-" AND (if they already
 *    exist) have isDemo == true. If a real document is found at a demo ID,
 *    the script stops without writing anything.
 *  - Creates NO Firebase Auth accounts and NO users/ documents.
 *  - Creates any MISSING default categories the demo products need; existing
 *    categories are never changed (and are not removed by --remove).
 *  - Does not change security rules. (The Admin SDK bypasses rules, which is
 *    why it only runs on your computer with your private key — never in the app.)
 *  - Repeatable: running it again updates the same documents and re-uses the
 *    images already uploaded to Cloudinary instead of uploading duplicates.
 *
 * Needs:
 *  - .env.local with VITE_FIREBASE_PROJECT_ID, VITE_CLOUDINARY_CLOUD_NAME,
 *    VITE_CLOUDINARY_UPLOAD_PRESET
 *  - A service-account key file (see README "Demo data"). By default
 *    ./firebase-admin-key.json, or set FIREBASE_ADMIN_KEY=/path/to/key.json
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { fail, initAdmin } from '../lib/admin-sdk.mjs'
import { DEMO_CATEGORIES, DEMO_FARMS, DEMO_NOTE } from './demo-data.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const args = new Set(process.argv.slice(2))
const WRITE = args.has('--write')
const REMOVE = args.has('--remove')
const DEMO_PREFIX = 'demo-'

// ---------- helpers ----------

function productId(slug) {
  return `${DEMO_PREFIX}${slug}`
}

/** Uploads a local image with the app's unsigned preset. Returns { url, publicId }. */
async function uploadToCloudinary(filePath, { cloudName, uploadPreset }) {
  const form = new FormData()
  form.append('file', new Blob([readFileSync(filePath)], { type: 'image/jpeg' }), 'photo.jpg')
  form.append('upload_preset', uploadPreset)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.secure_url) {
    throw new Error(body?.error?.message ?? `Cloudinary upload failed (HTTP ${response.status})`)
  }
  return { url: body.secure_url, publicId: body.public_id }
}

// ---------- main ----------

const { env, projectId } = initAdmin()
const db = getFirestore()

console.log(`\nFarm To Home demo seeder`)
console.log(`  Project: ${projectId}`)
console.log(`  Mode:    ${REMOVE ? 'REMOVE' : 'SEED'} ${WRITE ? '(writing)' : '(preview only — add --write to apply)'}\n`)

if (REMOVE) {
  await removeDemoData()
} else {
  await seedDemoData()
}
process.exit(0)

// ---------- seed ----------

async function seedDemoData() {
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    fail('VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET must be set in .env.local')
  }
  const credits = JSON.parse(readFileSync(join(HERE, 'image-credits.json'), 'utf8'))

  // 1. Read every target document first and make sure none is real data.
  const farmRefs = DEMO_FARMS.map((farm) => db.doc(`farms/${farm.id}`))
  const productRefs = DEMO_FARMS.flatMap((farm) =>
    farm.products.map((p) => db.doc(`products/${productId(p.slug)}`)),
  )
  const snapshots = await db.getAll(...farmRefs, ...productRefs)
  const existing = new Map(snapshots.map((snap) => [snap.ref.path, snap]))

  const conflicts = snapshots.filter((snap) => snap.exists && snap.get('isDemo') !== true)
  if (conflicts.length) {
    fail(
      'These documents already exist and are NOT demo data, so nothing was written:\n' +
        conflicts.map((snap) => `  - ${snap.ref.path}`).join('\n'),
    )
  }

  let created = 0
  let updated = 0
  let uploads = 0

  // Categories used by the demo products: create the missing ones only.
  // Existing categories (yours) are never changed.
  const categorySnaps = await db.getAll(...DEMO_CATEGORIES.map((c) => db.doc(`categories/${c.value}`)))
  const missingCategories = DEMO_CATEGORIES.filter((_, i) => !categorySnaps[i].exists)
  missingCategories.forEach((c) => console.log(`+ create  categories/${c.value}  ${c.label}`))
  if (WRITE) {
    const batch = db.batch()
    // Marks the defaults as seeded so the app doesn't try to add them again.
    batch.set(db.doc('settings/categories'), { defaultsSeeded: true, seededAt: FieldValue.serverTimestamp() }, { merge: true })
    missingCategories.forEach((c) =>
      batch.set(db.doc(`categories/${c.value}`), {
        label: c.label,
        emoji: c.emoji,
        isActive: true,
        sortOrder: DEMO_CATEGORIES.indexOf(c) * 10,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    )
    await batch.commit()
  }

  for (const farm of DEMO_FARMS) {
    if (!farm.id.startsWith(DEMO_PREFIX)) fail(`Farm id "${farm.id}" must start with "${DEMO_PREFIX}"`)
    const farmRef = db.doc(`farms/${farm.id}`)
    const farmSnap = existing.get(farmRef.path)
    const farmLocation = `${farm.city}, Maharashtra`

    const batch = db.batch()
    batch.set(farmRef, {
      farmName: farm.farmName,
      city: farm.city,
      state: 'Maharashtra',
      description: `${farm.description}\n\n(${DEMO_NOTE})`,
      isDemo: true,
      createdAt: farmSnap?.exists ? farmSnap.get('createdAt') : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (farmSnap?.exists) updated++
    else created++
    console.log(`${farmSnap?.exists ? '↻ update' : '+ create'}  farms/${farm.id}  ${farm.farmName} (${farm.city})`)

    for (const [index, product] of farm.products.entries()) {
      const ref = db.doc(`products/${productId(product.slug)}`)
      const snap = existing.get(ref.path)
      const credit = credits[product.image]
      if (!credit) fail(`No image credit for "${product.image}" in image-credits.json`)

      // Re-use the Cloudinary image from a previous run if there is one.
      const previous = snap?.exists ? snap.get('images')?.[0] : null
      let image
      if (previous?.url?.includes(`res.cloudinary.com/${cloudName}/`)) {
        image = { url: previous.url, publicId: previous.publicId }
      } else if (WRITE) {
        image = await uploadToCloudinary(join(HERE, 'images', `${product.image}.jpg`), {
          cloudName,
          uploadPreset,
        })
        uploads++
      } else {
        image = { url: '(will upload)', publicId: '' }
        uploads++
      }

      batch.set(ref, {
        farmerId: farm.id,
        farmName: farm.farmName,
        farmLocation,
        name: product.name,
        description: `${product.description}\n\n${DEMO_NOTE}`,
        category: product.category,
        price: product.price,
        mrp: product.mrp ?? null,
        unit: product.unit,
        stock: product.stock,
        images: [{ ...image, credit }],
        isActive: true,
        isDemo: true,
        // Spread creation times so "Newest first" has a stable order.
        createdAt: snap?.exists
          ? snap.get('createdAt')
          : new Date(Date.now() - (DEMO_FARMS.indexOf(farm) * 10 + index) * 60_000),
        updatedAt: FieldValue.serverTimestamp(),
      })
      if (snap?.exists) updated++
      else created++
      console.log(`  ${snap?.exists ? '↻' : '+'} products/${ref.id}  ${product.name}  ₹${product.price}/${product.unit}  stock ${product.stock}`)
    }

    if (WRITE) await batch.commit()
  }

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
  console.log(
    WRITE
      ? `\nDone: ${created} created, ${updated} updated, ${plural(uploads, 'image')} uploaded.`
      : `\nPreview: ${created} to create, ${updated} to update, ${plural(uploads, 'image')} to upload.`,
  )
  if (!WRITE) console.log('Run again with --write to apply.\n')
}

// ---------- remove ----------

async function removeDemoData() {
  const [farms, products] = await Promise.all([
    db.collection('farms').where('isDemo', '==', true).get(),
    db.collection('products').where('isDemo', '==', true).get(),
  ])
  // Double check: only delete documents that are BOTH flagged and demo-prefixed.
  const targets = [...farms.docs, ...products.docs].filter((d) => d.id.startsWith(DEMO_PREFIX))

  if (!targets.length) {
    console.log('No demo documents found. Nothing to remove.\n')
    return
  }
  targets.forEach((d) => console.log(`  - ${d.ref.path}`))

  if (!WRITE) {
    console.log(`\nPreview: ${targets.length} documents would be deleted. Add --write to delete.\n`)
    return
  }

  // Firestore batches hold up to 500 writes.
  for (let i = 0; i < targets.length; i += 400) {
    const batch = db.batch()
    targets.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  console.log(`\nDeleted ${targets.length} demo documents.`)
  console.log(
    'Note: the demo photos stay in your Cloudinary media library (folder set by your\n' +
      'upload preset). Delete them there if you want — removing them needs your\n' +
      'Cloudinary login, which this script deliberately never uses.\n',
  )
}
