/**
 * End-to-end workflows for customers, farmers and admins, using the REAL app
 * services against the Auth + Firestore emulators with the real security rules.
 * Run: npm run test:emulator
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { beforeAll, describe, expect, it } from 'vitest'
import { auth, db } from '../src/config/firebase'
import { setCustomerBlocked, setFarmerStatus, setProductHiddenByAdmin } from '../src/services/adminService'
import { logOut, signIn, signUp } from '../src/services/authService'
import {
  addMissingDefaultCategories,
  deleteCategory,
  ensureDefaultCategories,
  saveCategory,
} from '../src/services/categoryService'
import { DEFAULT_CATEGORIES } from '../src/utils/constants'
import { saveFarm } from '../src/services/farmService'
import { fetchCatalog } from '../src/services/marketplaceService'
import {
  cancelOrder,
  CheckoutError,
  newOrderId,
  placeOrder,
  updateShipmentStatus,
} from '../src/services/orderService'
import { createProduct, setProductListed } from '../src/services/productService'
import {
  deleteReview,
  fetchAllReviews,
  fetchFarmReviews,
  fetchProductReviews,
  findDeliveredOrderFor,
  saveReview,
} from '../src/services/reviewService'
import { summarizeReviews } from '../src/utils/reviews'
import { sendContactMessage } from '../src/services/profileService'
import { getSalesStats } from '../src/utils/farmerStats'
import { asSuperuser, assertEmulatorOnly, expectDenied, makeAdmin, resetEmulators } from './helpers'

const PASSWORD = 'Passw0rd!'
const IMAGE = [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', publicId: 'sample' }]
const ADDRESS = {
  fullName: 'Asha Patil',
  phone: '9876543210',
  line1: '12 Market Road',
  line2: '',
  landmark: 'Near temple',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
}

const users = {}
const products = {}

async function as(name) {
  if (auth.currentUser) await logOut()
  await signIn(`${name}@test.dev`, PASSWORD)
}

async function register(name, role) {
  if (auth.currentUser) await logOut()
  const user = await signUp({ name: `Test ${name}`, email: `${name}@test.dev`, password: PASSWORD, role })
  users[name] = user.uid
  return user.uid
}

function productValues(overrides) {
  return {
    name: 'Product',
    description: '',
    category: 'vegetables',
    price: '30',
    mrp: '',
    unit: 'kg',
    stock: '10',
    images: IMAGE,
    isActive: true,
    ...overrides,
  }
}

async function stockOf(productId) {
  return (await getDoc(doc(db, 'products', productId))).data().stock
}

describe('Farm To Home workflows (emulator)', () => {
  beforeAll(async () => {
    assertEmulatorOnly()
    await resetEmulators()
    await register('admin', 'customer')
    await makeAdmin(users.admin)
    await register('farmerA', 'farmer')
    await register('farmerB', 'farmer')
    await register('farmerC', 'farmer') // gets suspended later
    await register('customer', 'customer')
    await register('other', 'customer')
  })

  it('the first signed-in farmer gets the default categories created automatically', async () => {
    // A previous attempt got part-way (one default exists, with an admin's
    // edit, and no marker yet): retrying finishes the job without touching it.
    await asSuperuser((sdb) =>
      setDoc(doc(sdb, 'categories', 'fruits'), {
        label: 'Fresh Fruits', emoji: '🍎', isActive: true, sortOrder: 10,
        createdAt: new Date(), updatedAt: new Date(),
      }),
    )
    await as('farmerA')
    // Two seeding runs at once (e.g. two tabs) create each category once.
    const created = await Promise.all([ensureDefaultCategories(), ensureDefaultCategories()])
    expect(created[0] + created[1]).toBe(7)
    const cats = await getDocs(collection(db, 'categories'))
    expect(cats.docs.map((d) => d.id).sort()).toEqual(DEFAULT_CATEGORIES.map((c) => c.value).sort())
    expect((await getDoc(doc(db, 'categories', 'fruits'))).data().label).toBe('Fresh Fruits') // not overwritten
    expect((await getDoc(doc(db, 'settings', 'categories'))).exists()).toBe(true)
    expect(await ensureDefaultCategories()).toBe(0) // already seeded: nothing happens

    // Once seeded, an admin's deletion sticks: farmers don't recreate it,
    // but the admin can restore it — and existing ones are never rewritten.
    await as('admin')
    expect(await addMissingDefaultCategories()).toBe(0)
    await deleteCategory('honey-jaggery')
    await as('farmerB')
    expect(await ensureDefaultCategories()).toBe(0)
    expect((await getDoc(doc(db, 'categories', 'honey-jaggery'))).exists()).toBe(false)
    await as('admin')
    expect(await addMissingDefaultCategories()).toBe(1)
    expect((await getDoc(doc(db, 'categories', 'fruits'))).data().label).toBe('Fresh Fruits')
  })

  it('a brand-new farmer can set up a farm and list a product immediately', async () => {
    await as('farmerA')
    const farmA = { farmName: 'Alpha Farm', city: 'Nashik', state: 'Maharashtra' }
    await saveFarm(users.farmerA, { ...farmA, description: '' }, { isNew: true, syncProducts: false })
    products.tomato = await createProduct(users.farmerA, farmA, productValues({ name: 'Tomatoes', price: '30', stock: '10' }))
    expect((await getDoc(doc(db, 'products', products.tomato))).data().isActive).toBe(true)
  })

  it('farmers list more products', async () => {
    const farmA = { farmName: 'Alpha Farm', city: 'Nashik', state: 'Maharashtra' }
    await as('farmerA')
    products.mango = await createProduct(users.farmerA, farmA, productValues({ name: 'Mangoes', category: 'fruits', price: '950', unit: 'dozen', stock: '2' }))
    for (let i = 1; i <= 5; i++) {
      products[`veg${i}`] = await createProduct(users.farmerA, farmA, productValues({ name: `Veg ${i}`, price: '19.99', stock: '50' }))
    }

    await as('farmerB')
    const farmB = { farmName: 'Beta Dairy', city: 'Kolhapur', state: 'Maharashtra' }
    await saveFarm(users.farmerB, { ...farmB, description: '' }, { isNew: true, syncProducts: false })
    products.milk = await createProduct(users.farmerB, farmB, productValues({ name: 'Milk', category: 'dairy-eggs', price: '64.5', unit: 'litre', stock: '5' }))
    products.paneer = await createProduct(users.farmerB, farmB, productValues({ name: 'Paneer', category: 'dairy-eggs', price: '110', unit: '250g', stock: '9' }))
  })

  it('a customer places a multi-farmer COD order with exact totals and stock updates', async () => {
    await as('customer')
    const orderId = newOrderId()
    const result = await placeOrder({
      orderId,
      address: ADDRESS,
      cartItems: [
        { productId: products.tomato, quantity: 3 },
        { productId: products.milk, quantity: 2 },
        { productId: products.mango, quantity: 1 },
      ],
    })
    expect(result).toEqual({ orderId, alreadyPlaced: false })
    users.firstOrder = orderId

    const order = (await getDoc(doc(db, 'orders', orderId))).data()
    expect(order.subtotalPaise).toBe(3 * 3000 + 2 * 6450 + 95000)
    expect(order.deliveryFeePaise).toBe(0) // over ₹500
    expect(order.totalPaise).toBe(116900)
    expect(order.farmerIds.sort()).toEqual([users.farmerA, users.farmerB].sort())
    expect(order.fulfilment[users.farmerA].status).toBe('placed')
    expect(await stockOf(products.tomato)).toBe(7)
    expect(await stockOf(products.milk)).toBe(3)
    expect(await stockOf(products.mango)).toBe(1)

    // Submitting the same checkout again does not create a second order.
    const again = await placeOrder({ orderId, address: ADDRESS, cartItems: [{ productId: products.tomato, quantity: 3 }] })
    expect(again.alreadyPlaced).toBe(true)
    expect(await stockOf(products.tomato)).toBe(7)
  })

  it('charges ₹40 delivery below ₹500 and handles paise prices exactly', async () => {
    await as('customer')
    const orderId = newOrderId()
    await placeOrder({ orderId, address: ADDRESS, cartItems: [{ productId: products.veg1, quantity: 3 }] })
    const order = (await getDoc(doc(db, 'orders', orderId))).data()
    expect(order.items[0].unitPricePaise).toBe(1999)
    expect(order.subtotalPaise).toBe(5997)
    expect(order.deliveryFeePaise).toBe(4000)
    expect(order.totalPaise).toBe(9997)
    users.smallOrder = orderId
  })

  it('accepts the maximum of 6 different products from 2 farms in one order', async () => {
    await as('customer')
    const ids = [products.tomato, products.veg1, products.veg2, products.veg3, products.milk, products.paneer]
    const orderId = newOrderId()
    await placeOrder({ orderId, address: ADDRESS, cartItems: ids.map((productId) => ({ productId, quantity: 1 })) })
    expect((await getDoc(doc(db, 'orders', orderId))).data().items).toHaveLength(6)
    users.bigOrder = orderId
  })

  it('refuses to oversell', async () => {
    await as('customer')
    const error = await placeOrder({ orderId: newOrderId(), address: ADDRESS, cartItems: [{ productId: products.mango, quantity: 5 }] }).catch((e) => e)
    expect(error).toBeInstanceOf(CheckoutError)
    expect(error.problems[0]).toMatchObject({ type: 'stock', available: 1 })
    expect(await stockOf(products.mango)).toBe(1)
  })

  it('blocks tampered orders and stock changes', async () => {
    await as('customer')
    const tomato = (await getDoc(doc(db, 'products', products.tomato))).data()
    const fakeOrder = (orderId, overrides = {}) => ({
      customerId: users.customer,
      customerEmail: 'customer@test.dev',
      address: ADDRESS,
      items: [{ productId: products.tomato, farmerId: users.farmerA, farmName: 'Alpha Farm', name: tomato.name, unit: 'kg', image: '', unitPricePaise: 3000, quantity: 1, lineTotalPaise: 3000 }],
      quantities: { [products.tomato]: 1 },
      itemFarmerIds: [users.farmerA],
      farmerIds: [users.farmerA],
      fulfilment: { [users.farmerA]: { status: 'placed', placedAt: serverTimestamp() } },
      subtotalPaise: 3000,
      deliveryFeePaise: 4000,
      totalPaise: 7000,
      paymentMethod: 'cod',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    })
    const attempt = (orderId, order, stockChange = -1) => {
      const batch = writeBatch(db)
      batch.set(doc(db, 'orders', orderId), order)
      if (stockChange !== null) {
        batch.update(doc(db, 'products', products.tomato), { stock: tomato.stock + stockChange, lastOrderId: orderId })
      }
      return batch.commit()
    }

    // Wrong price (₹1 instead of ₹30)
    let id = newOrderId()
    await expectDenied(attempt(id, fakeOrder(id, {
      items: [{ ...fakeOrder(id).items[0], unitPricePaise: 100, lineTotalPaise: 100 }],
      subtotalPaise: 100, totalPaise: 4100,
    })))
    // Order without reducing stock
    id = newOrderId()
    await expectDenied(attempt(id, fakeOrder(id), null))
    // Reducing stock by less than ordered
    id = newOrderId()
    await expectDenied(attempt(id, fakeOrder(id, { items: [{ ...fakeOrder(id).items[0], quantity: 2, lineTotalPaise: 6000 }], quantities: { [products.tomato]: 2 }, subtotalPaise: 6000, totalPaise: 10000 }), -1))
    // quantities map that disagrees with the order lines
    id = newOrderId()
    await expectDenied(attempt(id, fakeOrder(id, { quantities: { [products.tomato]: 5 } }), -5))
    // Wrong delivery fee
    id = newOrderId()
    await expectDenied(attempt(id, fakeOrder(id, { deliveryFeePaise: 0, totalPaise: 3000 })))
    // Ordering for someone else
    id = newOrderId()
    await expectDenied(attempt(id, fakeOrder(id, { customerId: users.other })))
    // Changing stock without an order
    await expectDenied(updateDoc(doc(db, 'products', products.tomato), { stock: 0, lastOrderId: 'no-such-order' }))
    // A customer cannot mark their order as shipped
    await expectDenied(updateShipmentStatus(users.firstOrder, [users.farmerA], 'shipped'))
    expect(await stockOf(products.tomato)).toBe(6) // 10 − 3 (first order) − 1 (6-item order); tampering changed nothing
  })

  it('other customers cannot see an order', async () => {
    await as('other')
    await expect(getDoc(doc(db, 'orders', users.firstOrder))).rejects.toThrow()
  })

  it('farmers manage only their own part of an order', async () => {
    await as('farmerA')
    await updateShipmentStatus(users.firstOrder, [users.farmerA], 'confirmed')
    await expectDenied(updateShipmentStatus(users.firstOrder, [users.farmerB], 'confirmed'))
    await expectDenied(updateShipmentStatus(users.firstOrder, [users.farmerA], 'delivered')) // skipping "shipped"
    await updateShipmentStatus(users.firstOrder, [users.farmerA], 'shipped')
    await updateShipmentStatus(users.firstOrder, [users.farmerA], 'delivered')

    const order = (await getDoc(doc(db, 'orders', users.firstOrder))).data()
    expect(order.fulfilment[users.farmerA].status).toBe('delivered')
    expect(order.fulfilment[users.farmerA].deliveredAt).toBeTruthy()
    expect(order.fulfilment[users.farmerB].status).toBe('placed')

    const stats = getSalesStats([{ id: users.firstOrder, ...order }], users.farmerA)
    expect(stats.revenuePaise).toBe(3 * 3000 + 95000)
    expect(stats.unitsSold).toBe(4)
  })

  it('a farmer cancelling their part puts the stock back', async () => {
    await as('farmerB')
    const before = await stockOf(products.milk)
    await updateShipmentStatus(users.firstOrder, [users.farmerB], 'cancelled')
    expect(await stockOf(products.milk)).toBe(before + 2)
    await expectDenied(updateShipmentStatus(users.firstOrder, [users.farmerB], 'confirmed')) // cancelled is final
  })

  it('customers can cancel only before any farmer confirms, and stock returns', async () => {
    await as('customer')
    const orderSnap = await getDoc(doc(db, 'orders', users.firstOrder))
    await expectDenied(cancelOrder({ id: orderSnap.id, ...orderSnap.data() }))

    const before = await stockOf(products.veg1)
    const small = await getDoc(doc(db, 'orders', users.smallOrder))
    await cancelOrder({ id: small.id, ...small.data() })
    expect(await stockOf(products.veg1)).toBe(before + 3)
    const after = (await getDoc(doc(db, 'orders', users.smallOrder))).data()
    expect(after.fulfilment[users.farmerA].status).toBe('cancelled')
  })

  it('only customers with a delivered order can review, and reviews are public', async () => {
    const tomato = { id: products.tomato, farmerId: users.farmerA }
    const milk = { id: products.milk, farmerId: users.farmerB }

    await as('customer')
    expect(await findDeliveredOrderFor(users.customer, tomato)).toBe(users.firstOrder)
    expect(await findDeliveredOrderFor(users.customer, milk)).toBeNull() // that shipment was cancelled
    await saveReview({ uid: users.customer, product: tomato, orderId: users.firstOrder, customerName: 'Asha P.', rating: 5, comment: 'Very fresh!' }, { isNew: true })
    await expectDenied(saveReview({ uid: users.customer, product: milk, orderId: users.firstOrder, customerName: 'Asha P.', rating: 5, comment: '' }, { isNew: true }))
    await expectDenied(saveReview({ uid: users.customer, product: tomato, orderId: users.firstOrder, customerName: 'Asha P.', rating: 6, comment: '' }, { isNew: false }))
    await expectDenied(saveReview({ uid: users.other, product: tomato, orderId: users.firstOrder, customerName: 'Fake', rating: 1, comment: '' }, { isNew: true })) // someone else's review slot

    await as('other')
    expect(await findDeliveredOrderFor(users.other, tomato)).toBeNull()
    await expectDenied(saveReview({ uid: users.other, product: tomato, orderId: users.firstOrder, customerName: 'Other', rating: 1, comment: '' }, { isNew: true }))
    await expectDenied(saveReview({ uid: users.customer, product: tomato, orderId: users.firstOrder, customerName: 'Asha P.', rating: 1, comment: 'tampered' }, { isNew: false }))

    await logOut()
    const list = await fetchProductReviews(products.tomato)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ rating: 5, customerName: 'Asha P.', farmerId: users.farmerA })
    expect(await fetchFarmReviews(users.farmerA)).toHaveLength(1)
    expect((await fetchAllReviews()).length).toBeGreaterThanOrEqual(1)
    expect(summarizeReviews(list)).toEqual({ count: 1, average: 5 })

    await as('customer')
    await saveReview({ uid: users.customer, product: tomato, rating: 4, comment: 'Still good' }, { isNew: false })
    expect((await fetchProductReviews(products.tomato))[0].rating).toBe(4)

    await as('admin')
    await deleteReview(products.tomato, users.customer)
    expect(await fetchProductReviews(products.tomato)).toHaveLength(0)
  })

  it('suspending a farmer hides their products; reinstating relists them', async () => {
    await as('admin')
    const changed = await setFarmerStatus(users.farmerA, 'suspended')
    expect(changed).toBe(7)
    await logOut()
    const catalog = await fetchCatalog()
    expect(catalog.some((p) => p.farmerId === users.farmerA)).toBe(false)

    await as('farmerA')
    await expectDenied(setProductListed(products.tomato, true))
    await expectDenied(createProduct(users.farmerA, { farmName: 'Alpha Farm', city: 'Nashik', state: 'Maharashtra' }, productValues({ name: 'Sneaky' })))

    await as('admin')
    expect(await setFarmerStatus(users.farmerA, 'active')).toBe(7)
    await logOut()
    expect((await fetchCatalog()).filter((p) => p.farmerId === users.farmerA)).toHaveLength(7)
  })

  it('an admin-hidden product stays hidden even after reinstating its farmer', async () => {
    await as('admin')
    await setProductHiddenByAdmin(products.paneer, true)
    await setFarmerStatus(users.farmerB, 'suspended')
    await setFarmerStatus(users.farmerB, 'active')
    expect((await getDoc(doc(db, 'products', products.paneer))).data()).toMatchObject({ isActive: false, hiddenBy: 'admin' })
    await as('farmerB')
    await expectDenied(setProductListed(products.paneer, true))
    await as('admin')
    await setProductHiddenByAdmin(products.paneer, false)
  })

  it('blocked customers cannot order', async () => {
    await as('admin')
    await setCustomerBlocked(users.other, true)
    await as('other')
    await expectDenied(placeOrder({ orderId: newOrderId(), address: ADDRESS, cartItems: [{ productId: products.tomato, quantity: 1 }] }))
    await as('admin')
    await setCustomerBlocked(users.other, false)
    await as('other')
    await placeOrder({ orderId: newOrderId(), address: ADDRESS, cartItems: [{ productId: products.tomato, quantity: 1 }] })
  })

  it('switched-off categories cannot get new products', async () => {
    await as('admin')
    await saveCategory('spices-herbs', { label: 'Spices & Herbs', emoji: '🌶️', isActive: false, sortOrder: 40 }, { isNew: false })
    await as('farmerA')
    await expectDenied(createProduct(users.farmerA, { farmName: 'Alpha Farm', city: 'Nashik', state: 'Maharashtra' }, productValues({ category: 'spices-herbs' })))
    await expectDenied(createProduct(users.farmerA, { farmName: 'Alpha Farm', city: 'Nashik', state: 'Maharashtra' }, productValues({ category: 'made-up' })))
  })

  it('roles cannot be escalated', async () => {
    await as('customer')
    await expectDenied(updateDoc(doc(db, 'users', users.customer), { role: 'admin' }))
    await as('admin')
    await setFarmerStatus(users.farmerC, 'suspended')
    await as('farmerC')
    await expectDenied(updateDoc(doc(db, 'users', users.farmerC), { farmerStatus: 'active' })) // can't reinstate yourself
    await as('admin')
    await expectDenied(updateDoc(doc(db, 'users', users.customer), { role: 'admin', statusUpdatedAt: serverTimestamp() }))
    await expectDenied(setCustomerBlocked(users.farmerA, true)) // only customers can be blocked
  })

  it('contact messages are private to admins', async () => {
    await as('customer')
    await sendContactMessage({ name: 'Asha Patil', subject: 'Delivery question', message: 'When will my order arrive?', orderId: '' })
    await expect(getDocs(collection(db, 'messages'))).rejects.toThrow()
    await expectDenied(addDoc(collection(db, 'messages'), { uid: users.other, email: 'x@y.z', name: 'Spoof', subject: 'Hi there', message: 'Pretending to be someone else', orderId: '', status: 'new', createdAt: serverTimestamp() }))
    await as('admin')
    expect((await getDocs(collection(db, 'messages'))).size).toBe(1)
  })
})
