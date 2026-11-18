import { localized, msg } from '../i18n'
import { CATEGORY_SLUG_PATTERN, getCategoryLabel } from './constants'
import { getDiscountPercent } from './formatters'

// Labels are translated where shown: t(option.label).
export const SORT_OPTIONS = Object.freeze([
  { value: 'relevance', label: msg('Relevance') },
  { value: 'newest', label: msg('Newest first') },
  { value: 'price-asc', label: msg('Price: low to high') },
  { value: 'price-desc', label: msg('Price: high to low') },
  { value: 'discount', label: msg('Biggest discount') },
])

// Quick price ranges shown in the filter panel (prices are per unit).
// Upper bounds end just below the next range (prices have at most 2
// decimals), so a ₹50 item is in "₹50 – ₹100" only, not also in "Under ₹50".
export const PRICE_RANGES = Object.freeze([
  { label: msg('Under ₹50'), min: null, max: 49.99 },
  { label: msg('₹50 – ₹100'), min: 50, max: 99.99 },
  { label: msg('₹100 – ₹250'), min: 100, max: 249.99 },
  { label: msg('₹250 and above'), min: 250, max: null },
])

/** The quick range matching min/max exactly, if any. */
export function findPriceRange(min, max) {
  return PRICE_RANGES.find((r) => r.min === min && r.max === max) ?? null
}


const VALID_SORTS = new Set(SORT_OPTIONS.map((s) => s.value))

function toPrice(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

/** Reads filters from the URL (?q=&category=&min=&max=&sort=), ignoring bad values. */
export function parseFilters(searchParams) {
  const q = (searchParams.get('q') ?? '').trim().slice(0, 100)
  const category = searchParams.get('category')
  const sort = searchParams.get('sort')
  return {
    q,
    category: category && CATEGORY_SLUG_PATTERN.test(category) ? category : '',
    min: toPrice(searchParams.get('min')),
    max: toPrice(searchParams.get('max')),
    sort: VALID_SORTS.has(sort) ? sort : q ? 'relevance' : 'newest',
  }
}

/** Builds URL search params from filters, leaving out empty/default values. */
export function filtersToParams(filters) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.min != null) params.set('min', String(filters.min))
  if (filters.max != null) params.set('max', String(filters.max))
  const defaultSort = filters.q ? 'relevance' : 'newest'
  if (filters.sort && filters.sort !== defaultSort) params.set('sort', filters.sort)
  return params
}

// Where a search word is found, and how much that counts.
// Hindi/Marathi product names, category names and descriptions are
// searched too, so "टमाटर" finds tomatoes whatever language is shown.
const SEARCH_FIELDS = [
  { weight: 5, get: (p) => [p.name, p.translations?.hi?.name, p.translations?.mr?.name].join(' ') },
  { weight: 5, get: (p) => localized(p, 'name') },
  { weight: 3, get: (p) => getCategoryLabel(p.category) },
  { weight: 2, get: (p) => p.farmName },
  { weight: 2, get: (p) => p.farmLocation },
  { weight: 1, get: (p) => [p.description, p.translations?.hi?.description, p.translations?.mr?.description].join(' ') },
]

/**
 * Relevance score for a search, or 0 if the product doesn't match.
 * Every word typed must appear somewhere (name, category, farm, place or description)
 * at the START of a word — so "pea" finds "peas" but "oil" doesn't find "boil".
 */
function scoreProduct(product, matchers, phrase) {
  let score = 0
  for (const matcher of matchers) {
    let wordScore = 0
    for (const field of SEARCH_FIELDS) {
      if (matcher.test(field.get(product) ?? '')) {
        wordScore = Math.max(wordScore, field.weight)
      }
    }
    if (wordScore === 0) return 0
    score += wordScore
  }
  const names = [product.name, localized(product, 'name')].map((n) => (n ?? '').toLowerCase())
  if (names.includes(phrase)) score += 10
  else if (names.some((n) => n.startsWith(phrase))) score += 5
  return score
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const SORTERS = {
  newest: (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  discount: (a, b) => getDiscountPercent(b.price, b.mrp) - getDiscountPercent(a.price, a.mrp),
}

/** Applies search, category, price filters and sorting. Returns a new array. */
export function filterProducts(products, filters) {
  const phrase = filters.q.toLowerCase()
  const words = phrase.split(/\s+/).filter(Boolean)
  const matchers = words.map((word) => new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${escapeRegExp(word)}`, 'iu'))

  let results = products
    .filter((p) => !filters.category || p.category === filters.category)
    .filter((p) => filters.min == null || p.price >= filters.min)
    .filter((p) => filters.max == null || p.price <= filters.max)
    .map((p) => ({ product: p, score: words.length ? scoreProduct(p, matchers, phrase) : 1 }))
    .filter((entry) => entry.score > 0)

  if (filters.sort === 'relevance' && words.length) {
    results.sort((a, b) => b.score - a.score || SORTERS.newest(a.product, b.product))
  } else {
    const sorter = SORTERS[filters.sort] ?? SORTERS.newest
    results.sort((a, b) => sorter(a.product, b.product))
  }
  results = results.map((entry) => entry.product)
  return results
}

/** Number of visible products in each category, e.g. { vegetables: 10 }. */
export function countByCategory(products) {
  return products.reduce((counts, p) => {
    counts[p.category] = (counts[p.category] ?? 0) + 1
    return counts
  }, {})
}
