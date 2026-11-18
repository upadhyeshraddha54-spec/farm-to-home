import { getOrderStatusLabel } from '../../utils/constants'

const STYLES = {
  placed: 'bg-sky-100 text-sky-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-amber-100 text-amber-800',
  delivered: 'bg-brand-100 text-brand-800',
  cancelled: 'bg-red-100 text-red-700',
  processing: 'bg-amber-100 text-amber-800',
}

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? STYLES.placed}`}>
      {getOrderStatusLabel(status)}
    </span>
  )
}
