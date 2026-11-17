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

const TABS = [
  { value: 'placed', label: 'New' },
  { value: 'confirmed', label: 'To ship' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
]

export default function FarmerOrdersPage() {
  const { uid, orders, ordersLoading, ordersError } = useFarmerData()
  const [tab, setTab] = useState(ORDER_STATUS.PLACED)

  const parts = orders.map((order) => ({ order, part: getFarmerPart(order, uid) }))
  const counts = parts.reduce((acc, { part }) => ({ ...acc, [part.status]: (acc[part.status] ?? 0) + 1 }), {})
  const shown = tab === 'all' ? parts : parts.filter(({ part }) => part.status === tab)

  return (
    <div className="max-w-4xl">
      <PageMeta title="Orders" noIndex />
      <PageHeader title="Orders" subtitle="Your part of each customer order. Payment is Cash on Delivery." />

      <div className="mb-4 flex gap-2 relative overflow-x-auto pb-1" role="tablist" aria-label="Order status">
        {TABS.map((t) => {
          const count = t.value === 'all' ? parts.length : counts[t.value] ?? 0
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
              }`}
            >
              {t.label} <span className="opacity-70">{count}</span>
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
          title={parts.length ? 'Nothing here' : 'No orders yet'}
          message={
            parts.length
              ? 'No orders with this status.'
              : 'When customers order your products, they’ll appear here.'
          }
        />
      ) : (
        <ul className="space-y-4">
          {shown.map(({ order, part }) => (
            <li key={order.id} className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">Order #{shortOrderId(order.id)}</p>
                  <p className="text-xs text-gray-500">Placed {formatDateTime(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={part.status} />
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    Collect {formatPaise(part.subtotalPaise)}
                  </p>
                </div>
              </div>
              <ShipmentTimeline status={part.status} timestamps={part.timestamps} />
              <div className="mt-3 grid gap-4 md:grid-cols-[1fr_16rem]">
                <OrderItems items={part.items} linkToProducts={false} />
                <AddressBlock address={order.address} title="Deliver to" />
              </div>
              {order.farmerIds.length > 1 && (
                <p className="mt-2 text-xs text-gray-500">
                  This order also has items from other farms; they deliver those separately.
                </p>
              )}
              {collectsDeliveryFee(order, uid) && part.status !== ORDER_STATUS.CANCELLED && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  You are shipment 1, so also collect the {formatPaise(order.deliveryFeePaise)} delivery
                  fee — {formatPaise(part.subtotalPaise + order.deliveryFeePaise)} in total.
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
