import { t } from '../i18n'
import { PRODUCT_UNIT_VALUES } from './constants'
import { translationsToForm, validateTranslations } from './translations'

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
  translations: translationsToForm(null, ['name', 'description']),
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
    translations: translationsToForm(product, ['name', 'description']),
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
      ? t('Please enter a product name.')
      : name.length < 2
        ? t('Name must be at least 2 characters.')
        : name.length > PRODUCT_LIMITS.NAME_MAX
          ? t('Name must be {count} characters or fewer.', { count: PRODUCT_LIMITS.NAME_MAX })
          : '',

    description:
      values.description.trim().length > PRODUCT_LIMITS.DESCRIPTION_MAX
        ? t('Description must be {count} characters or fewer.', { count: PRODUCT_LIMITS.DESCRIPTION_MAX })
        : '',

    translations: validateTranslations(values.translations, {
      name: PRODUCT_LIMITS.NAME_MAX,
      description: PRODUCT_LIMITS.DESCRIPTION_MAX,
    }),

    category: categories.some((c) => c.value === values.category)
      ? ''
      : t('Please choose a category.'),

    unit: PRODUCT_UNIT_VALUES.includes(values.unit) ? '' : t('Please choose a unit.'),

    price: !MONEY_PATTERN.test(String(values.price).trim())
      ? t('Enter a price like 40 or 49.50.')
      : price <= 0
        ? t('Price must be more than ₹0.')
        : price > PRODUCT_LIMITS.PRICE_MAX
          ? t('Price can’t be more than {amount}.', { amount: `₹${PRODUCT_LIMITS.PRICE_MAX.toLocaleString('en-IN')}` })
          : '',

    mrp: !hasMrp
      ? ''
      : !MONEY_PATTERN.test(String(values.mrp).trim())
        ? t('Enter an MRP like 50 or 59.90.')
        : mrp < price
          ? t('MRP can’t be lower than your selling price.')
          : mrp > PRODUCT_LIMITS.PRICE_MAX
            ? t('MRP can’t be more than {amount}.', { amount: `₹${PRODUCT_LIMITS.PRICE_MAX.toLocaleString('en-IN')}` })
            : '',

    stock: !/^\d+$/.test(stockText)
      ? t('Enter stock as a whole number (0 or more).')
      : stock > PRODUCT_LIMITS.STOCK_MAX
        ? t('Stock can’t be more than {count}.', { count: PRODUCT_LIMITS.STOCK_MAX.toLocaleString('en-IN') })
        : '',

    images: values.images.length === 0 ? t('Add at least one photo.') : '',
  }
}
