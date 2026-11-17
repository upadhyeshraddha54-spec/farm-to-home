export const APP_NAME = 'Farm To Home'
export const APP_TAGLINE = 'Fresh from the farm, straight to your door'

// The three user roles, stored on each user's Firestore profile (users/{uid}).
// Only CUSTOMER and FARMER can be chosen at signup. ADMIN is granted with
// `npm run admin:grant` (or by hand in the Firebase console), and the
// security rules block anyone from giving themselves that role.
export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  FARMER: 'farmer',
  ADMIN: 'admin',
})

export const ROLE_LABELS = Object.freeze({
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.FARMER]: 'Farmer',
  [ROLES.ADMIN]: 'Admin',
})

// Farmers can sell as soon as they sign up. An admin can suspend a farmer,
// which hides their products until they are reinstated.
// Legacy values ('pending', 'approved', 'rejected') from before approval was
// removed all count as ACTIVE — see isFarmerSuspended().
export const FARMER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
})

export const FARMER_STATUS_LABELS = Object.freeze({
  active: 'Active',
  suspended: 'Suspended',
})

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

export const DEFAULT_CATEGORIES = Object.freeze([
  { value: 'vegetables', label: 'Vegetables', emoji: '🥦' },
  { value: 'fruits', label: 'Fruits', emoji: '🥭' },
  { value: 'grains-pulses', label: 'Grains & Pulses', emoji: '🌾' },
  { value: 'dairy-eggs', label: 'Dairy & Eggs', emoji: '🥛' },
  { value: 'spices-herbs', label: 'Spices & Herbs', emoji: '🌶️' },
  { value: 'dry-fruits-nuts', label: 'Dry Fruits & Nuts', emoji: '🥜' },
  { value: 'honey-jaggery', label: 'Honey & Jaggery', emoji: '🍯' },
  { value: 'oils-ghee', label: 'Oils & Ghee', emoji: '🫙' },
])

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Labels/emoji of the categories loaded from Firestore (set by CategoriesProvider).
let categoryRegistry = new Map()

export function setCategoryRegistry(categories) {
  categoryRegistry = new Map(categories.map((c) => [c.value, c]))
}

export function getCategoryLabel(value) {
  return (
    categoryRegistry.get(value)?.label ??
    DEFAULT_CATEGORIES.find((c) => c.value === value)?.label ??
    value
  )
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

export const PRODUCT_UNITS = Object.freeze([
  { value: 'kg', label: 'per kg' },
  { value: '500g', label: 'per 500 g' },
  { value: '250g', label: 'per 250 g' },
  { value: 'litre', label: 'per litre' },
  { value: 'dozen', label: 'per dozen' },
  { value: 'piece', label: 'per piece' },
  { value: 'bunch', label: 'per bunch' },
])

export const MAX_PRODUCT_IMAGES = 5
export const MAX_IMAGE_SIZE_MB = 5
export const ALLOWED_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
export const LOW_STOCK_THRESHOLD = 5

export function getUnitLabel(value) {
  return PRODUCT_UNITS.find((u) => u.value === value)?.label ?? value
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

export const ORDER_STATUS_LABELS = Object.freeze({
  placed: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  processing: 'In progress',
})

// Next steps a farmer (or admin) can take from each status.
export const NEXT_STATUSES = Object.freeze({
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
})

export const INDIAN_STATES = Object.freeze([
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
])
