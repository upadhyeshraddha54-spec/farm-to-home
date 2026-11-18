import { useState } from 'react'
import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useAdminData from '../../hooks/useAdminData'
import { adminOrderPath } from '../../routes/paths'
import { getOrderStatusLabel } from '../../utils/constants'
import { formatDateTime } from '../../utils/formatters'
import { formatPaise, getOverallStatus, shortOrderId } from '../../utils/orders'
import { t, tp } from '../../i18n'

const FILTERS = ['all', 'placed', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const { orders, ordersLoading, ordersError } = useAdminData()
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  const term = search.trim().toLowerCase()
  const shown = orders
    .filter((o) => status === 'all' || getOverallStatus(o) === status)
    .filter(
      (o) =>
        !term ||
        o.id.toLowerCase().startsWith(term) ||
        o.customerEmail?.toLowerCase().includes(term) ||
        o.address?.fullName?.toLowerCase().includes(term) ||
        o.address?.phone?.includes(term),
    )

  return (
    <div className="max-w-5xl">
      <PageMeta title={t('Orders')} noIndex />
      <PageHeader title={t('Orders')} subtitle={t('Showing the most recent {count} orders', { count: orders.length })} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="order-search" className="sr-only">{t('Search orders')}</label>
        <input
          id="order-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Order number, customer, email or phone')}
          className="h-10 w-full max-w-xs rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
        <label htmlFor="order-status" className="sr-only">{t('Status')}</label>
        <select
          id="order-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm"
        >
          {FILTERS.map((f) => (
            <option key={f} value={f}>{f === 'all' ? t('All statuses') : getOrderStatusLabel(f)}</option>
          ))}
        </select>
      </div>

      {ordersError ? (
        <LoadError error={ordersError} />
      ) : ordersLoading ? (
        <Spinner fullPage />
      ) : shown.length === 0 ? (
        <EmptyState title={t('No orders found')} message={orders.length ? t('Try a different search or status.') : t('No orders have been placed yet.')} />
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
          {shown.map((order) => (
            <li key={order.id}>
              <Link to={adminOrderPath(order.id)} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-cream-50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    #{shortOrderId(order.id)} · {order.address?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(order.createdAt)} ·{' '}
                    {tp(order.items.length, '{count} product', '{count} products')} ·{' '}
                    {tp(order.farmerIds.length, '{count} farm', '{count} farms')} · {order.address?.city}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={getOverallStatus(order)} />
                  <span className="text-sm font-semibold">{formatPaise(order.totalPaise)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
