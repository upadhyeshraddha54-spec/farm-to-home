import { useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import { AddressBlock, OrderItems } from '../../components/order/OrderParts'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import ShipmentActions from '../../components/order/ShipmentActions'
import ShipmentTimeline from '../../components/order/ShipmentTimeline'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useFarmerData from '../../hooks/useFarmerData'
import { ORDER_STATUS } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDateTime } from '../../utils/formatters'
import { collectsDeliveryFee, formatPaise, getFarmerPart, shortOrderId } from '../../utils/orders'
import { msg, t } from '../../i18n'

const TABS = [
  { value: 'placed', label: msg('New') },
  { value: 'confirmed', label: msg('To ship') },
  { value: 'shipped', label: msg('Shipped') },
  { value: 'delivered', label: msg('Delivered') },
  { value: 'cancelled', label: msg('Cancelled') },
  { value: 'all', label: msg('All') },
]

export default function FarmerOrdersPage() {
  const { uid, orders, ordersLoading, ordersError } = useFarmerData()
  const [tab, setTab] = useState(ORDER_STATUS.PLACED)

  const parts = orders.map((order) => ({ order, part: getFarmerPart(order, uid) }))
  const counts = parts.reduce((acc, { part }) => ({ ...acc, [part.status]: (acc[part.status] ?? 0) + 1 }), {})
  const shown = tab === 'all' ? parts : parts.filter(({ part }) => part.status === tab)

  return (
    <div className="max-w-4xl">
      <PageMeta title={t('Orders')} noIndex />
      <PageHeader title={t('Orders')} subtitle={t('Your part of each customer order. Payment is Cash on Delivery.')} />

      <div className="mb-4 flex gap-2 relative overflow-x-auto pb-1" role="tablist" aria-label={t('Order status')}>
        {TABS.map((item) => {
          const count = item.value === 'all' ? parts.length : counts[item.value] ?? 0
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => setTab(item.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === item.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
              }`}
            >
              {t(item.label)} <span className="opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {ordersError ? (
        <Alert variant="error">{getFriendlyErrorMessage(ordersError)}</Alert>
      ) : ordersLoading ? (
        <Spinner fullPage />
      ) : shown.length === 0 ? (
        <EmptyState
          title={parts.length ? t('Nothing here') : t('No orders yet')}
          message={
            parts.length
              ? t('No orders with this status.')
              : t('When customers order your products, they’ll appear here.')
          }
        />
      ) : (
        <ul className="space-y-4">
          {shown.map(({ order, part }) => (
            <li key={order.id} className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{t('Order #{id}', { id: shortOrderId(order.id) })}</p>
                  <p className="text-xs text-gray-500">{t('Placed {date}', { date: formatDateTime(order.createdAt) })}</p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={part.status} />
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {t('Collect {amount}', { amount: formatPaise(part.subtotalPaise) })}
                  </p>
                </div>
              </div>
              <ShipmentTimeline status={part.status} timestamps={part.timestamps} />
              <div className="mt-3 grid gap-4 md:grid-cols-[1fr_16rem]">
                <OrderItems items={part.items} linkToProducts={false} />
                <AddressBlock address={order.address} title={t('Deliver to')} />
              </div>
              {order.farmerIds.length > 1 && (
                <p className="mt-2 text-xs text-gray-500">
                  {t('This order also has items from other farms; they deliver those separately.')}
                </p>
              )}
              {collectsDeliveryFee(order, uid) && part.status !== ORDER_STATUS.CANCELLED && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {t('You are shipment 1, so also collect the {fee} delivery fee — {total} in total.', {
                    fee: formatPaise(order.deliveryFeePaise),
                    total: formatPaise(part.subtotalPaise + order.deliveryFeePaise),
                  })}
                </p>
              )}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <ShipmentActions orderId={order.id} farmerId={uid} status={part.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
