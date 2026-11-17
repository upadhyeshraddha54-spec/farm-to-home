import { ROLES } from '../utils/constants'

// Single source of truth for URLs.
// Use these constants instead of typing paths by hand, so a URL
// only ever needs to change in one place.
export const PATHS = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  ACCOUNT: '/account',

  // Store
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:productId',
  FARMS: '/farms',
  FARM_DETAIL: '/farms/:farmId',

  // Customer
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:orderId',

  // Farmer dashboard
  FARMER: '/farmer',
  FARMER_PRODUCTS: '/farmer/products',
  FARMER_PRODUCT_NEW: '/farmer/products/new',
  FARMER_PRODUCT_EDIT: '/farmer/products/:productId/edit',
  FARMER_ORDERS: '/farmer/orders',
  FARMER_PROFILE: '/farmer/profile',

  // Admin dashboard
  ADMIN: '/admin',
  ADMIN_FARMERS: '/admin/farmers',
  ADMIN_USERS: '/admin/users',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: '/admin/orders/:orderId',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_MESSAGES: '/admin/messages',

  // Information & policies
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy-policy',
  TERMS: '/terms',
  SHIPPING: '/shipping-policy',
  CANCELLATION: '/cancellation-policy',
  RETURNS: '/returns-and-refunds',
})

const withId = (pattern, param, id) => pattern.replace(`:${param}`, encodeURIComponent(id))

/** URL of a product's public page. */
export const productPath = (productId) => withId(PATHS.PRODUCT_DETAIL, 'productId', productId)

/** URL of a farm's public page. */
export const farmPath = (farmId) => withId(PATHS.FARM_DETAIL, 'farmId', farmId)

/** Builds the edit URL for one product. */
export const farmerProductEditPath = (productId) =>
  withId(PATHS.FARMER_PRODUCT_EDIT, 'productId', productId)

export const orderPath = (orderId) => withId(PATHS.ORDER_DETAIL, 'orderId', orderId)
export const adminOrderPath = (orderId) => withId(PATHS.ADMIN_ORDER_DETAIL, 'orderId', orderId)

/** Product listing URL with filters, e.g. productsPath({ category: 'fruits' }). */
export function productsPath(params = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  ).toString()
  return search ? `${PATHS.PRODUCTS}?${search}` : PATHS.PRODUCTS
}

/** Where to send a user right after they sign in. */
export function getDefaultPathForRole(role) {
  switch (role) {
    case ROLES.FARMER:
      return PATHS.FARMER
    case ROLES.ADMIN:
      return PATHS.ADMIN
    case ROLES.CUSTOMER:
    default:
      return PATHS.HOME
  }
}
