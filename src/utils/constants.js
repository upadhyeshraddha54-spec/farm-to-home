import { getLanguage, msg, t } from '../i18n'

export const APP_NAME = 'Farm To Home'
export const APP_TAGLINE = msg('Fresh from the farm, straight to your door')

// The three user roles, stored on each user's Firestore profile (users/{uid}).
// Only CUSTOMER and FARMER can be chosen at signup. ADMIN is granted with
// `npm run admin:grant` (or by hand in the Firebase console), and the
// security rules block anyone from giving themselves that role.
export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  FARMER: 'farmer',
  ADMIN: 'admin',
})

const ROLE_LABELS = Object.freeze({
  [ROLES.CUSTOMER]: msg('Customer'),
  [ROLES.FARMER]: msg('Farmer'),
  [ROLES.ADMIN]: msg('Admin'),
})

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ? t(ROLE_LABELS[role]) : role
}

// Farmers can sell as soon as they sign up. An admin can suspend a farmer,
// which hides their products until they are reinstated.
// Legacy values ('pending', 'approved', 'rejected') from before approval was
// removed all count as ACTIVE — see isFarmerSuspended().
export const FARMER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
})

const FARMER_STATUS_LABELS = Object.freeze({
  active: msg('Active'),
  suspended: msg('Suspended'),
})

export function getFarmerStatusLabel(status) {
  return t(FARMER_STATUS_LABELS[normalizeFarmerStatus(status)])
}

export function isFarmerSuspended(status) {
  return status === FARMER_STATUS.SUSPENDED
}

/** Normalises any stored value to 'active' | 'suspended'. */
export function normalizeFarmerStatus(status) {
  return isFarmerSuspended(status) ? FARMER_STATUS.SUSPENDED : FARMER_STATUS.ACTIVE
}

export const PASSWORD_MIN_LENGTH = 8

// ---------- Categories ----------
// Categories live in Firestore (categories/{slug}) and are managed by admins.
// These defaults are created automatically for a new store (by the first
// signed-in user, see ensureDefaultCategories), can be re-added from
// Admin → Categories, and are used as label fallbacks. Labels and order
// (index * 10) must match isDefaultCategory() in firestore.rules. Slugs must match ^[a-z0-9]+(-[a-z0-9]+)*$

// Labels stay English in Firestore (the rules check them); they are
// translated when shown — see getCategoryLabel().
export const DEFAULT_CATEGORIES = Object.freeze([
  { value: 'vegetables', label: msg('Vegetables'), emoji: '🥦' },
  { value: 'fruits', label: msg('Fruits'), emoji: '🥭' },
  { value: 'grains-pulses', label: msg('Grains & Pulses'), emoji: '🌾' },
  { value: 'dairy-eggs', label: msg('Dairy & Eggs'), emoji: '🥛' },
  { value: 'spices-herbs', label: msg('Spices & Herbs'), emoji: '🌶️' },
  { value: 'dry-fruits-nuts', label: msg('Dry Fruits & Nuts'), emoji: '🥜' },
  { value: 'honey-jaggery', label: msg('Honey & Jaggery'), emoji: '🍯' },
  { value: 'oils-ghee', label: msg('Oils & Ghee'), emoji: '🫙' },
])

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Labels/emoji of the categories loaded from Firestore (set by CategoriesProvider).
let categoryRegistry = new Map()

export function setCategoryRegistry(categories) {
  categoryRegistry = new Map(categories.map((c) => [c.value, c]))
}

/**
 * A category's name in the current language:
 * 1. the Hindi/Marathi name an admin entered (category.translations),
 * 2. the built-in translation of a default category (unless renamed),
 * 3. the stored name.
 */
export function getCategoryLabel(value) {
  const stored = categoryRegistry.get(value)
  const fallback = DEFAULT_CATEGORIES.find((c) => c.value === value)
  const own = stored?.translations?.[getLanguage()]?.label
  if (typeof own === 'string' && own.trim()) return own.trim()
  if (fallback && (!stored || stored.label === fallback.label)) return t(fallback.label)
  return stored?.label ?? value
}

export function getCategoryEmoji(value) {
  return (
    categoryRegistry.get(value)?.emoji ||
    DEFAULT_CATEGORIES.find((c) => c.value === value)?.emoji ||
    '🧺'
  )
}

// ---------- Products ----------
// NOTE: units are also listed in firestore.rules — keep both in sync.

const PRODUCT_UNITS = Object.freeze([
  { value: 'kg', label: msg('per kg') },
  { value: '500g', label: msg('per 500 g') },
  { value: '250g', label: msg('per 250 g') },
  { value: 'litre', label: msg('per litre') },
  { value: 'dozen', label: msg('per dozen') },
  { value: 'piece', label: msg('per piece') },
  { value: 'bunch', label: msg('per bunch') },
])

export const PRODUCT_UNIT_VALUES = Object.freeze(PRODUCT_UNITS.map((u) => u.value))

/** Unit options in the current language, for <Select>. */
export function getUnitOptions() {
  return PRODUCT_UNITS.map((u) => ({ value: u.value, label: t(u.label) }))
}

export const MAX_PRODUCT_IMAGES = 5
export const MAX_IMAGE_SIZE_MB = 5
export const ALLOWED_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
export const LOW_STOCK_THRESHOLD = 5

// "How many do you have?" wording for the stock field, per unit.
const STOCK_UNIT_LABELS = Object.freeze({
  kg: msg('Stock available (number of kg)'),
  '500g': msg('Stock available (number of 500 g packs)'),
  '250g': msg('Stock available (number of 250 g packs)'),
  litre: msg('Stock available (number of litres)'),
  dozen: msg('Stock available (number of dozens)'),
  piece: msg('Stock available (number of pieces)'),
  bunch: msg('Stock available (number of bunches)'),
})

const STOCK_LABEL_FALLBACK = msg('Stock available')

export function getStockLabel(unit) {
  return t(STOCK_UNIT_LABELS[unit] ?? STOCK_LABEL_FALLBACK)
}

export function getUnitLabel(value) {
  const unit = PRODUCT_UNITS.find((u) => u.value === value)
  return unit ? t(unit.label) : value
}

// ---------- Reviews ----------
export const REVIEW_COMMENT_MAX = 1000

// ---------- Orders ----------
// NOTE: these limits are also enforced in firestore.rules — keep both in sync.

export const MAX_ORDER_ITEMS = 6 // different products per order (Firestore rules budget)
export const MAX_ITEM_QUANTITY = 20 // units of one product per order
export const DELIVERY_FEE_PAISE = 4000 // ₹40
export const FREE_DELIVERY_FROM_PAISE = 50000 // free delivery from ₹500

// Status of each farmer's part ("shipment") of an order.
export const ORDER_STATUS = Object.freeze({
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
})

const ORDER_STATUS_LABELS = Object.freeze({
  placed: msg('Placed'),
  confirmed: msg('Confirmed'),
  shipped: msg('Shipped'),
  delivered: msg('Delivered'),
  cancelled: msg('Cancelled'),
  processing: msg('In progress'),
})

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] ? t(ORDER_STATUS_LABELS[status]) : status
}

// Next steps a farmer (or admin) can take from each status.
export const NEXT_STATUSES = Object.freeze({
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
})

// Stored in English in addresses/farms; shown translated via getStateLabel().
export const INDIAN_STATES = Object.freeze([
  msg('Andhra Pradesh'),
  msg('Arunachal Pradesh'),
  msg('Assam'),
  msg('Bihar'),
  msg('Chhattisgarh'),
  msg('Goa'),
  msg('Gujarat'),
  msg('Haryana'),
  msg('Himachal Pradesh'),
  msg('Jharkhand'),
  msg('Karnataka'),
  msg('Kerala'),
  msg('Madhya Pradesh'),
  msg('Maharashtra'),
  msg('Manipur'),
  msg('Meghalaya'),
  msg('Mizoram'),
  msg('Nagaland'),
  msg('Odisha'),
  msg('Punjab'),
  msg('Rajasthan'),
  msg('Sikkim'),
  msg('Tamil Nadu'),
  msg('Telangana'),
  msg('Tripura'),
  msg('Uttar Pradesh'),
  msg('Uttarakhand'),
  msg('West Bengal'),
  msg('Andaman and Nicobar Islands'),
  msg('Chandigarh'),
  msg('Dadra and Nagar Haveli and Daman and Diu'),
  msg('Delhi'),
  msg('Jammu and Kashmir'),
  msg('Ladakh'),
  msg('Lakshadweep'),
  msg('Puducherry'),
])

export function getStateLabel(state) {
  return INDIAN_STATES.includes(state) ? t(state) : state
}

/** "Nashik, Maharashtra" → "Nashik, महाराष्ट्र" (the state part is translated). */
export function getLocationLabel(location) {
  if (!location) return ''
  return location
    .split(', ')
    .map((part) => getStateLabel(part))
    .join(', ')
}

/** State options in the current language, for <Select>. */
export function getStateOptions() {
  return INDIAN_STATES.map((state) => ({ value: state, label: t(state) }))
}
