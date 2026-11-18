import { getLanguage, getLocale } from '../i18n'

/** Formats a Firestore Timestamp (or Date) like "9 Nov 2026", in the current language. */
export function formatDate(value) {
  const date = typeof value?.toDate === 'function' ? value.toDate() : value
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Formats a 10-digit number as "98765 43210". */
export function formatPhone(phone) {
  if (!phone) return '—'
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

/** Formats a number of rupees like "₹1,250" or "₹49.50". */
export function formatPrice(amount) {
  return inrFormatter.format(Number(amount) || 0)
}

/** Percentage off, e.g. price 80, mrp 100 → 20. Returns 0 if no discount. */
export function getDiscountPercent(price, mrp) {
  if (!mrp || mrp <= price) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

/** Formats a Firestore Timestamp (or Date) like "9 Nov, 4:30 pm". */
export function formatDateTime(value) {
  const date = typeof value?.toDate === 'function' ? value.toDate() : value
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(getLocale(), {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    // Hindi/Marathi locale data writes "am/pm" in English, so use a 24-hour clock there.
    ...(getLanguage() === 'en' ? {} : { hourCycle: 'h23' }),
  })
}

/** Formats an ISO date string ("2026-11-12") as a long date in the current language. */
export function formatLongDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
}
