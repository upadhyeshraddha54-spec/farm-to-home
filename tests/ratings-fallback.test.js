/**
 * The store must keep working when reviews cannot be read — for example when
 * the live project still runs rules from before reviews existed. This loads a
 * copy of the rules WITHOUT the reviews permissions and checks the catalogue,
 * farm page and product page still load (with empty ratings).
 * Run: npm run test:emulator
 */
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collectionGroup, doc, getDocs, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../src/config/firebase'
import { fetchCatalog, fetchFarmPage, fetchProductPage, fetchStorefront } from '../src/services/marketplaceService'
import { assertEmulatorOnly, PROJECT_ID, resetEmulators } from './helpers'

const FULL_RULES = readFileSync('firestore.rules', 'utf8')
// Remove both review rules: the subcollection match and the collection-group match.
const OLD_RULES = FULL_RULES.replace(/    match \/products\/\{productId\}\/reviews\/\{uid\} \{[\s\S]*?\n    \}\n/, '').replace(
  /    match \/\{path=\*\*\}\/reviews\/\{reviewId\} \{[\s\S]*?\n    \}\n/,
  '',
)

let env

describe('store without review permissions (older live rules)', () => {
  beforeAll(async () => {
    assertEmulatorOnly()
    await resetEmulators()
    expect(FULL_RULES.match(/match [^\n]*reviews/g)).toHaveLength(2)
    expect(OLD_RULES).not.toMatch(/match [^\n]*reviews/)
    env = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules: OLD_RULES, host: '127.0.0.1', port: 8085 },
    })
    await env.withSecurityRulesDisabled(async (ctx) => {
      const sdb = ctx.firestore()
      await setDoc(doc(sdb, 'farms/f1'), { farmName: 'Alpha Farm', city: 'Nashik', state: 'Maharashtra', description: '' })
      await setDoc(doc(sdb, 'products/p1'), {
        farmerId: 'f1', farmName: 'Alpha Farm', farmLocation: 'Nashik, Maharashtra', name: 'Tomatoes',
        description: '', category: 'vegetables', price: 30, mrp: null, unit: 'kg', stock: 5,
        images: [{ url: 'https://res.cloudinary.com/x/a.jpg', publicId: 'a' }], isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      })
    })
  })

  afterAll(async () => {
    // Put the full rules back for any test file that runs after this one.
    if (env) {
      await env.cleanup()
      const restore = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules: FULL_RULES, host: '127.0.0.1', port: 8085 },
      })
      await restore.cleanup()
    }
  })

  it('review reads really are denied under the old rules', async () => {
    await expect(getDocs(collectionGroup(db, 'reviews'))).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('catalogue, storefront, farm page and product page still load with empty ratings', async () => {
    const catalog = await fetchCatalog()
    expect(catalog).toHaveLength(1)
    expect(catalog[0].rating).toEqual({ count: 0, average: 0 })

    const storefront = await fetchStorefront()
    expect(storefront.products).toHaveLength(1)
    expect(storefront.farms[0].rating).toEqual({ count: 0, average: 0 })

    const farmPage = await fetchFarmPage('f1')
    expect(farmPage.farm.rating).toEqual({ count: 0, average: 0 })
    expect(farmPage.products).toHaveLength(1)

    const productPage = await fetchProductPage('p1')
    expect(productPage.product.name).toBe('Tomatoes')
    expect(productPage.reviews).toEqual([])
  })
})
