import { ORDER_STATUS } from '../../utils/constants'
import { formatDateTime } from '../../utils/formatters'
import { msg, t } from '../../i18n'

const STEPS = [
  { status: ORDER_STATUS.PLACED, field: 'placedAt', label: msg('Placed') },
  { status: ORDER_STATUS.CONFIRMED, field: 'confirmedAt', label: msg('Confirmed') },
  { status: ORDER_STATUS.SHIPPED, field: 'shippedAt', label: msg('Shipped') },
  { status: ORDER_STATUS.DELIVERED, field: 'deliveredAt', label: msg('Delivered') },
]

/** Placed → Confirmed → Shipped → Delivered (or Cancelled) with times. */
export default function ShipmentTimeline({ status, timestamps }) {
  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <p className="text-sm font-medium text-red-700">
        {timestamps.cancelledAt
          ? t('Cancelled on {date}', { date: formatDateTime(timestamps.cancelledAt) })
          : t('Cancelled')}
      </p>
    )
  }
  const reached = STEPS.findIndex((s) => s.status === status)

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label={t('Delivery progress')}>
      {STEPS.map((step, index) => {
        const done = index <= reached
        const at = timestamps[step.field]
        return (
          <li key={step.status} className="text-center" aria-current={index === reached ? 'step' : undefined}>
            <div className={`mx-auto h-1.5 rounded-full ${done ? 'bg-brand-600' : 'bg-gray-200'}`} />
            <p className={`mt-1.5 text-xs font-semibold ${done ? 'text-brand-800' : 'text-gray-400'}`}>
              {t(step.label)}
            </p>
            {done && at && <p className="text-[11px] text-gray-500">{formatDateTime(at)}</p>}
          </li>
        )
      })}
    </ol>
  )
}
