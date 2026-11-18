import { FREE_DELIVERY_FROM_PAISE } from '../../utils/constants'
import { formatPaise } from '../../utils/orders'
import { t, tp } from '../../i18n'

/** Subtotal / delivery / total box used by the cart, checkout and order pages. */
export default function OrderSummary({ totals, units, title = t('Order summary'), children, showFreeDeliveryHint = true }) {
  const { subtotalPaise, deliveryFeePaise, totalPaise } = totals
  const toFree = FREE_DELIVERY_FROM_PAISE - subtotalPaise

  return (
    <section className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm" aria-label={title}>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">
            {units != null ? tp(units, 'Items ({count} unit)', 'Items ({count} units)') : t('Items')}
          </dt>
          <dd className="font-medium text-gray-900">{formatPaise(subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">{t('Delivery')}</dt>
          <dd className={deliveryFeePaise ? 'font-medium text-gray-900' : 'font-semibold text-brand-700'}>
            {deliveryFeePaise ? formatPaise(deliveryFeePaise) : t('FREE')}
          </dd>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2 text-base">
          <dt className="font-semibold text-gray-900">{t('Total')}</dt>
          <dd className="font-bold text-gray-900">{formatPaise(totalPaise)}</dd>
        </div>
      </dl>
      {showFreeDeliveryHint && subtotalPaise > 0 && toFree > 0 && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
          {t('Add {amount} more for free delivery.', { amount: formatPaise(toFree) })}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
