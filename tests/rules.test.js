/**
 * Direct security-rule checks (users, farms, categories, products, orders).
 * Complements workflows.test.js, which exercises the app's real services.
 * Run: npm run test:emulator
 */
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { assertEmulatorOnly, getTestEnv, resetEmulators } from './helpers'

let env
const as = (uid, email = `${uid}@test.dev`) => env.authenticatedContext(uid, { email }).firestore()
const anon = () => env.unauthenticatedContext().firestore()

const product = (overrides = {}) => ({
  farmerId: 'farmer1', farmName: 'Green Farm', farmLocation: 'Nashik, Maharashtra',
  name: 'Tomatoes', description: '', category: 'vegetables', price: 40, mrp: null,
  unit: 'kg', stock: 10, images: [{ url: 'https://res.cloudinary.com/x/a.jpg', publicId: 'a' }],
  isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...overrides,
})

describe('security rules', () => {
  beforeAll(async () => {
    assertEmulatorOnly()
    await resetEmulators()
    env = await getTestEnv()
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'users/farmer1'), { name: 'Ravi', email: 'farmer1@test.dev', phone: '', role: 'farmer', farmerStatus: 'active' })
      await setDoc(doc(db, 'users/legacy1'), { name: 'Old', email: 'legacy1@test.dev', phone: '', role: 'farmer', farmerStatus: 'pending' }) // pre-dates removal of approval
      await setDoc(doc(db, 'users/suspended1'), { name: 'Sita', email: 'suspended1@test.dev', phone: '', role: 'farmer', farmerStatus: 'suspended' })
      await setDoc(doc(db, 'users/cust1'), { name: 'Cust', email: 'cust1@test.dev', phone: '', role: 'customer' })
      await setDoc(doc(db, 'users/admin1'), { name: 'Admin', email: 'admin1@test.dev', phone: '', role: 'admin' })
      await setDoc(doc(db, 'categories/vegetables'), { label: 'Vegetables', emoji: '', isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() })
      await setDoc(doc(db, 'categories/old'), { label: 'Old', emoji: '', isActive: false, sortOrder: 9, createdAt: new Date(), updatedAt: new Date() })
      await setDoc(doc(db, 'products/hidden1'), { ...product(), isActive: false, createdAt: new Date(), updatedAt: new Date() })
      await setDoc(doc(db, 'products/listed1'), { ...product(), createdAt: new Date(), updatedAt: new Date() })
      await setDoc(doc(db, 'products/susp1'), { ...product({ farmerId: 'suspended1' }), createdAt: new Date(), updatedAt: new Date() })
    })
  })
  afterAll(() => env?.cleanup())

  describe('users', () => {
    it('lets a new customer and a new (active) farmer sign up', async () => {
      await assertSucceeds(setDoc(doc(as('n1'), 'users/n1'), { name: 'New', email: 'n1@test.dev', phone: '', role: 'customer', createdAt: serverTimestamp() }))
      await assertSucceeds(setDoc(doc(as('n2'), 'users/n2'), { name: 'New', email: 'n2@test.dev', phone: '9876543210', role: 'farmer', farmerStatus: 'active', createdAt: serverTimestamp() }))
    })
    it('blocks signing up as admin, with a non-default farmer status, or for someone else', async () => {
      await assertFails(setDoc(doc(as('n3'), 'users/n3'), { name: 'Bad', email: 'n3@test.dev', phone: '', role: 'admin', createdAt: serverTimestamp() }))
      await assertFails(setDoc(doc(as('n4'), 'users/n4'), { name: 'Bad', email: 'n4@test.dev', phone: '', role: 'farmer', farmerStatus: 'approved', createdAt: serverTimestamp() }))
      await assertFails(setDoc(doc(as('n6'), 'users/n6'), { name: 'Bad', email: 'n6@test.dev', phone: '', role: 'farmer', createdAt: serverTimestamp() }))
      await assertFails(setDoc(doc(as('n5'), 'users/other'), { name: 'Bad', email: 'n5@test.dev', phone: '', role: 'customer', createdAt: serverTimestamp() }))
    })
    it('lets users edit only name, phone and a valid address', async () => {
      const db = as('cust1')
      await assertSucceeds(updateDoc(doc(db, 'users/cust1'), { name: 'Asha', phone: '9123456789' }))
      await assertSucceeds(updateDoc(doc(db, 'users/cust1'), { address: { fullName: 'Asha', phone: '9123456789', line1: '12 Road', line2: '', landmark: '', city: 'Pune', state: 'Maharashtra', pincode: '411001' } }))
      await assertFails(updateDoc(doc(db, 'users/cust1'), { address: { fullName: 'Asha', phone: '123', line1: '12 Road', line2: '', landmark: '', city: 'Pune', state: 'Maharashtra', pincode: '000000' } }))
      await assertFails(updateDoc(doc(db, 'users/cust1'), { blocked: false }))
    })
    it('keeps profiles private', async () => {
      await assertFails(getDoc(doc(as('cust1'), 'users/farmer1')))
      await assertFails(getDocs(collection(as('farmer1'), 'users')))
      await assertSucceeds(getDocs(collection(as('admin1'), 'users')))
    })
    it('lets admins change farmer status but not roles or their own profile', async () => {
      const db = as('admin1')
      await assertSucceeds(updateDoc(doc(db, 'users/legacy1'), { farmerStatus: 'suspended', statusUpdatedAt: serverTimestamp() }))
      await assertSucceeds(updateDoc(doc(db, 'users/legacy1'), { farmerStatus: 'active', statusUpdatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(db, 'users/farmer1'), { farmerStatus: 'approved', statusUpdatedAt: serverTimestamp() })) // old value no longer accepted
      await assertFails(updateDoc(doc(db, 'users/cust1'), { farmerStatus: 'suspended', statusUpdatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(db, 'users/cust1'), { role: 'farmer', statusUpdatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(db, 'users/admin1'), { blocked: true, statusUpdatedAt: serverTimestamp() }))
      await assertFails(deleteDoc(doc(db, 'users/cust1')))
    })
  })

  describe('categories & farms', () => {
    it('are public to read', async () => {
      await assertSucceeds(getDocs(collection(anon(), 'categories')))
      await assertSucceeds(getDocs(collection(anon(), 'farms')))
    })
    it('only admins manage categories, with valid IDs', async () => {
      const data = { label: 'Herbs', emoji: '🌿', isActive: true, sortOrder: 50, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      await assertFails(setDoc(doc(as('farmer1'), 'categories/herbs'), data))
      await assertSucceeds(setDoc(doc(as('admin1'), 'categories/herbs'), data))
      await assertFails(setDoc(doc(as('admin1'), 'categories/Bad Slug'), data))
    })
    it('any signed-in user may create the exact default categories, once', async () => {
      const def = (label, sortOrder, extra = {}) => ({ label, emoji: '', isActive: true, sortOrder, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra })
      const f = as('farmer1')
      await assertFails(setDoc(doc(anon(), 'categories/fruits'), def('Fruits', 10)))               // must be signed in
      await assertFails(setDoc(doc(f, 'categories/fruits'), def('Fruit basket', 10)))               // wrong label
      await assertFails(setDoc(doc(f, 'categories/fruits'), def('Fruits', 15)))                     // wrong order
      await assertFails(setDoc(doc(f, 'categories/fruits'), def('Fruits', 10, { isActive: false })))
      await assertFails(setDoc(doc(f, 'categories/exotic'), def('Exotic', 10)))                     // not a default
      await assertSucceeds(setDoc(doc(f, 'categories/fruits'), def('Fruits', 10)))
      await assertFails(updateDoc(doc(f, 'categories/fruits'), { label: 'Changed', updatedAt: serverTimestamp() })) // no edits
      await assertFails(setDoc(doc(f, 'categories/fruits'), def('Fruits', 10)))                     // exists: no overwrite
      const marker = () => ({ defaultsSeeded: true, seededAt: serverTimestamp() })
      // The marker can't be written early (that would block the automatic setup).
      await assertFails(setDoc(doc(f, 'settings/categories'), marker()))
      const rest = [['grains-pulses', 'Grains & Pulses', 20], ['dairy-eggs', 'Dairy & Eggs', 30],
        ['spices-herbs', 'Spices & Herbs', 40], ['dry-fruits-nuts', 'Dry Fruits & Nuts', 50],
        ['honey-jaggery', 'Honey & Jaggery', 60], ['oils-ghee', 'Oils & Ghee', 70]]
      for (const [slug, label, order] of rest) {
        await assertSucceeds(setDoc(doc(as('cust1'), `categories/${slug}`), def(label, order)))     // any signed-in user
      }
      await assertFails(setDoc(doc(f, 'settings/categories'), { defaultsSeeded: false, seededAt: serverTimestamp() }))
      await assertSucceeds(setDoc(doc(f, 'settings/categories'), marker()))
      await assertFails(setDoc(doc(f, 'settings/categories'), marker()))                            // no overwrite
      await assertFails(deleteDoc(doc(f, 'settings/categories')))
      await assertSucceeds(deleteDoc(doc(as('admin1'), 'categories/oils-ghee')))
      await assertFails(setDoc(doc(as('cust1'), 'categories/oils-ghee'), def('Oils & Ghee', 70)))   // marker exists now
      await assertSucceeds(setDoc(doc(as('admin1'), 'categories/oils-ghee'), def('Oils & Ghee', 70))) // admins always can
    })
    it('farmers write only their own farm', async () => {
      const farm = { farmName: 'Green Farm', city: 'Nashik', state: 'Maharashtra', description: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      await assertSucceeds(setDoc(doc(as('farmer1'), 'farms/farmer1'), farm))
      await assertFails(setDoc(doc(as('cust1'), 'farms/cust1'), farm))
      await assertFails(setDoc(doc(as('suspended1'), 'farms/farmer1'), farm, { merge: true }))
    })
  })

  describe('products', () => {
    it('active farmers (including legacy "pending" ones) list products; suspended ones cannot', async () => {
      await assertSucceeds(setDoc(doc(as('farmer1'), 'products/p1'), product()))
      await assertSucceeds(setDoc(doc(as('legacy1'), 'products/p1b'), product({ farmerId: 'legacy1' })))
      await assertFails(setDoc(doc(as('suspended1'), 'products/p2'), product({ farmerId: 'suspended1' })))
      await assertFails(updateDoc(doc(as('suspended1'), 'products/susp1'), { stock: 5, updatedAt: serverTimestamp() }))
      await assertFails(setDoc(doc(as('cust1'), 'products/p3'), product({ farmerId: 'cust1' })))
      await assertFails(setDoc(doc(as('farmer1'), 'products/p4'), product({ category: 'old' })))
      await assertFails(setDoc(doc(as('farmer1'), 'products/p5'), product({ price: 0 })))
      await assertFails(setDoc(doc(as('farmer1'), 'products/p6'), product({ stock: 1.5 })))
      await assertFails(setDoc(doc(as('farmer1'), 'products/p7'), product({ hiddenBy: 'admin', isActive: false })))
    })
    it('the public sees only listed products', async () => {
      await assertSucceeds(getDoc(doc(anon(), 'products/listed1')))
      await assertFails(getDoc(doc(anon(), 'products/hidden1')))
      await assertSucceeds(getDocs(query(collection(anon(), 'products'), where('isActive', '==', true), limit(50))))
      await assertFails(getDocs(collection(anon(), 'products')))
      await assertSucceeds(getDocs(query(collection(as('farmer1'), 'products'), where('farmerId', '==', 'farmer1'))))
    })
    it('nobody but the owner edits, and nobody changes stock without an order', async () => {
      await assertFails(updateDoc(doc(as('suspended1'), 'products/listed1'), { price: 1, updatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(as('cust1'), 'products/listed1'), { stock: 0, lastOrderId: 'nope' }))
      await assertFails(updateDoc(doc(as('cust1'), 'products/listed1'), { stock: 99, lastOrderId: 'nope' }))
      await assertSucceeds(updateDoc(doc(as('farmer1'), 'products/listed1'), { stock: 25, updatedAt: serverTimestamp() }))
    })
    it('admins may only change visibility', async () => {
      await assertSucceeds(updateDoc(doc(as('admin1'), 'products/listed1'), { isActive: false, hiddenBy: 'admin', updatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(as('farmer1'), 'products/listed1'), { isActive: true, updatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(as('admin1'), 'products/listed1'), { price: 1, updatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(as('admin1'), 'products/listed1'), { isActive: true, updatedAt: serverTimestamp() })) // still hiddenBy
    })
  })

  describe('translations (Hindi/Marathi text)', () => {
    const tr = (hi, mr) => ({ hi, mr })
    it('products accept valid translations and reject bad shapes or sizes', async () => {
      const f = as('farmer1')
      await assertSucceeds(setDoc(doc(f, 'products/t1'), product({
        translations: tr({ name: 'टमाटर', description: 'ताज़े टमाटर' }, { name: 'टोमॅटो', description: '' }),
      })))
      await assertSucceeds(setDoc(doc(f, 'products/t2'), product({ translations: { hi: { name: 'टमाटर' } } })))
      await assertFails(setDoc(doc(f, 'products/t3'), product({ translations: { fr: { name: 'Tomates' } } })))      // unknown language
      await assertFails(setDoc(doc(f, 'products/t4'), product({ translations: tr({ name: 'x', price: 1 }, {}) })))   // unknown field
      await assertFails(setDoc(doc(f, 'products/t5'), product({ translations: tr({ name: 'x'.repeat(101) }, {}) })))  // too long
      await assertFails(setDoc(doc(f, 'products/t6'), product({ translations: tr({ name: 5 }, {}) })))               // not text
      await assertFails(setDoc(doc(f, 'products/t7'), product({ translations: 'टमाटर' })))
      await assertSucceeds(updateDoc(doc(f, 'products/t1'), { translations: tr({ name: 'लाल टमाटर' }, {}), updatedAt: serverTimestamp() }))
      await assertFails(updateDoc(doc(as('cust1'), 'products/t1'), { translations: tr({ name: 'x' }, {}), updatedAt: serverTimestamp() }))
    })
    it('farms and categories accept translations for their own fields only', async () => {
      const farm = { farmName: 'Green Farm', city: 'Nashik', state: 'Maharashtra', description: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      await assertFails(setDoc(doc(as('legacy1'), 'farms/legacy1'), { ...farm, translations: tr({ name: 'x' }, {}) }))
      await assertSucceeds(setDoc(doc(as('legacy1'), 'farms/legacy1'), { ...farm, translations: tr({ farmName: 'ग्रीन फ़ार्म', description: '' }, {}) }))
      const cat = { label: 'Herbs', emoji: '🌿', isActive: true, sortOrder: 55, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      await assertSucceeds(setDoc(doc(as('admin1'), 'categories/herbs-tr'), { ...cat, translations: tr({ label: 'जड़ी-बूटियाँ' }, { label: 'वनौषधी' }) }))
      await assertFails(setDoc(doc(as('admin1'), 'categories/herbs-tr2'), { ...cat, translations: tr({ label: 'x'.repeat(41) }, {}) }))
    })
  })

  describe('reviews', () => {
    it('are public to read but cannot be written without a delivered order', async () => {
      await assertSucceeds(getDocs(collection(anon(), 'products/listed1/reviews')))
      const review = { productId: 'listed1', farmerId: 'farmer1', orderId: 'no-such-order', rating: 5, comment: 'Nice', customerName: 'Asha P.', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      await assertFails(setDoc(doc(anon(), 'products/listed1/reviews/anon'), review))
      await assertFails(setDoc(doc(as('cust1'), 'products/listed1/reviews/cust1'), review))
    })
  })

  describe('orders & messages', () => {
    it('cannot be listed by strangers or deleted', async () => {
      await assertFails(getDocs(collection(as('cust1'), 'orders')))
      await assertSucceeds(getDocs(query(collection(as('cust1'), 'orders'), where('customerId', '==', 'cust1'))))
      await assertSucceeds(getDocs(query(collection(as('farmer1'), 'orders'), where('farmerIds', 'array-contains', 'farmer1'))))
      await assertFails(getDocs(collection(anon(), 'orders')))
      await assertFails(deleteDoc(doc(as('admin1'), 'orders/any')))
    })
    it('farmers and admins cannot place orders', async () => {
      await assertFails(setDoc(doc(as('farmer1'), 'orders/o1'), { customerId: 'farmer1' }))
      await assertFails(setDoc(doc(as('admin1'), 'orders/o2'), { customerId: 'admin1' }))
    })
    it('messages: signed-in users send, only admins read', async () => {
      const msg = (uid) => ({ uid, email: `${uid}@test.dev`, name: 'Asha', subject: 'Hello', message: 'A question about delivery', orderId: '', status: 'new', createdAt: serverTimestamp() })
      await assertSucceeds(setDoc(doc(as('cust1'), 'messages/m1'), msg('cust1')))
      await assertFails(setDoc(doc(anon(), 'messages/m2'), msg('x')))
      await assertFails(getDoc(doc(as('cust1'), 'messages/m1')))
      await assertSucceeds(getDoc(doc(as('admin1'), 'messages/m1')))
    })
  })
})
