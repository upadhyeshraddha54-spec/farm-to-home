/** Formats a Firestore Timestamp (or Date) like "9 Nov 2026". */
export function formatDate(value) {
  const date = typeof value?.toDate === 'function' ? value.toDate() : value
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
