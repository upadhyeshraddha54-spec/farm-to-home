import { ORDER_STATUS } from '../../utils/constants'
import { formatDateTime } from '../../utils/formatters'

const STEPS = [
  { status: ORDER_STATUS.PLACED, label: 'Placed' },
  { status: ORDER_STATUS.CONFIRMED, label: 'Confirmed' },
  { status: ORDER_STATUS.SHIPPED, label: 'Shipped' },
  { status: ORDER_STATUS.DELIVERED, label: 'Delivered' },
]

/** Placed → Confirmed → Shipped → Delivered (or Cancelled) with times. */
export default function ShipmentTimeline({ status, timestamps }) {
  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <p className="text-sm font-medium text-red-700">
        Cancelled{timestamps.cancelledAt && ` on ${formatDateTime(timestamps.cancelledAt)}`}
      </p>
    )
  }
  const reached = STEPS.findIndex((s) => s.status === status)

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Delivery progress">
      {STEPS.map((step, index) => {
        const done = index <= reached
        const at = timestamps[`${step.status}At`]
        return (
          <li key={step.status} className="text-center" aria-current={index === reached ? 'step' : undefined}>
            <div className={`mx-auto h-1.5 rounded-full ${done ? 'bg-brand-600' : 'bg-gray-200'}`} />
            <p className={`mt-1.5 text-xs font-semibold ${done ? 'text-brand-800' : 'text-gray-400'}`}>
              {step.label}
            </p>
            {done && at && <p className="text-[11px] text-gray-500">{formatDateTime(at)}</p>}
          </li>
        )
      })}
    </ol>
  )
}
