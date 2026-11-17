import { PRODUCT_UNITS } from './constants'

// These limits are also enforced in firestore.rules.
export const PRODUCT_LIMITS = Object.freeze({
  NAME_MAX: 100,
  DESCRIPTION_MAX: 2000,
  PRICE_MAX: 100000,
  STOCK_MAX: 100000,
})

export const EMPTY_PRODUCT = {
  name: '',
  description: '',
  category: '',
  price: '',
  mrp: '',
  unit: 'kg',
  stock: '',
  images: [],
  isActive: true,
}

/** Converts a saved product into form values (numbers → text for inputs). */
export function productToFormValues(product) {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    category: product.category ?? '',
    price: product.price != null ? String(product.price) : '',
    mrp: product.mrp != null ? String(product.mrp) : '',
    unit: product.unit ?? 'kg',
    stock: product.stock != null ? String(product.stock) : '',
    images: product.images ?? [],
    isActive: product.isActive ?? true,
  }
}

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/

/** Returns { field: message } for every invalid field ('' when valid). */
export function validateProduct(values, categories) {
  const name = values.name.trim()
  const price = Number(values.price)
  const hasMrp = String(values.mrp).trim() !== ''
  const mrp = Number(values.mrp)
  const stockText = String(values.stock).trim()
  const stock = Number(stockText)

  return {
    name: !name
      ? 'Please enter a product name.'
      : name.length < 2
        ? 'Name must be at least 2 characters.'
        : name.length > PRODUCT_LIMITS.NAME_MAX
          ? `Name must be ${PRODUCT_LIMITS.NAME_MAX} characters or fewer.`
          : '',

    description:
      values.description.trim().length > PRODUCT_LIMITS.DESCRIPTION_MAX
        ? `Description must be ${PRODUCT_LIMITS.DESCRIPTION_MAX} characters or fewer.`
        : '',

    category: categories.some((c) => c.value === values.category)
      ? ''
      : 'Please choose a category.',

    unit: PRODUCT_UNITS.some((u) => u.value === values.unit) ? '' : 'Please choose a unit.',

    price: !MONEY_PATTERN.test(String(values.price).trim())
      ? 'Enter a price like 40 or 49.50.'
      : price <= 0
        ? 'Price must be more than ₹0.'
        : price > PRODUCT_LIMITS.PRICE_MAX
          ? `Price can’t be more than ₹${PRODUCT_LIMITS.PRICE_MAX.toLocaleString('en-IN')}.`
          : '',

    mrp: !hasMrp
      ? ''
      : !MONEY_PATTERN.test(String(values.mrp).trim())
        ? 'Enter an MRP like 50 or 59.90.'
        : mrp < price
          ? 'MRP can’t be lower than your selling price.'
          : mrp > PRODUCT_LIMITS.PRICE_MAX
            ? `MRP can’t be more than ₹${PRODUCT_LIMITS.PRICE_MAX.toLocaleString('en-IN')}.`
            : '',

    stock: !/^\d+$/.test(stockText)
      ? 'Enter stock as a whole number (0 or more).'
      : stock > PRODUCT_LIMITS.STOCK_MAX
        ? `Stock can’t be more than ${PRODUCT_LIMITS.STOCK_MAX.toLocaleString('en-IN')}.`
        : '',

    images: values.images.length === 0 ? 'Add at least one photo.' : '',
  }
}
