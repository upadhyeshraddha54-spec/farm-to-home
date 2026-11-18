import hi from './hi'
import mr from './mr'

/*
 * Tiny translation core.
 *
 *   t('Add to cart')                       → "कार्ट में डालें" (Hindi)
 *   t('Only {count} left', { count: 3 })   → placeholders in {braces}
 *   tp(n, '{count} product', '{count} products')   → English plural choice
 *   msg('Placed')                          → marks a string for translation
 *                                            without translating it yet
 *                                            (use t(value) where it is shown)
 *
 * Keys are the English text itself, so code stays readable and English needs
 * no dictionary. `npm run i18n:check` verifies every key exists in hi.js and
 * mr.js and that no visible text is left unwrapped.
 */

export const LANGUAGES = Object.freeze([
  { code: 'en', label: 'English', short: 'EN', locale: 'en-IN' },
  { code: 'hi', label: 'हिंदी', short: 'हिं', locale: 'hi-IN' },
  { code: 'mr', label: 'मराठी', short: 'मरा', locale: 'mr-IN' },
])

const DICTIONARIES = { en: {}, hi, mr }
const CODES = new Set(LANGUAGES.map((l) => l.code))
const STORAGE_KEY = 'fth-language'

let current = 'en'

/** The language to start with: saved choice, else the browser's, else English. */
export function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (CODES.has(saved)) return saved
  } catch {
    // storage blocked: fall through
  }
  const browser = (typeof navigator !== 'undefined' && navigator.language) || ''
  const base = browser.toLowerCase().split('-')[0]
  return CODES.has(base) ? base : 'en'
}

export function setLanguage(code) {
  current = CODES.has(code) ? code : 'en'
  try {
    localStorage.setItem(STORAGE_KEY, current)
  } catch {
    // private mode: the choice lasts for this visit
  }
  if (typeof document !== 'undefined') document.documentElement.lang = current
}

export function getLanguage() {
  return current
}

/** BCP-47 locale for dates (digits stay Latin, as on most Indian sites). */
export function getLocale() {
  const { locale } = LANGUAGES.find((l) => l.code === current)
  return current === 'en' ? locale : `${locale}-u-nu-latn`
}

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

export function t(key, vars) {
  const translated = DICTIONARIES[current]?.[key]
  return interpolate(translated ?? key, vars)
}

/** Plural helper: picks the English singular/plural key, then translates it. */
export function tp(count, one, other, vars = {}) {
  return t(count === 1 ? one : other, { count, ...vars })
}

/** Marks a string as translatable (for the checker) and returns it unchanged. */
export function msg(key) {
  return key
}

/**
 * Picks the current language's version of user-entered content.
 *   localized(product, 'name') → product.translations.hi.name || product.name
 */
export function localized(item, field) {
  if (!item) return ''
  const value = current !== 'en' ? item.translations?.[current]?.[field] : ''
  return (typeof value === 'string' && value.trim()) || item[field] || ''
}
