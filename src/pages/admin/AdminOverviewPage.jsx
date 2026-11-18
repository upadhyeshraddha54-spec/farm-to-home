import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import useAdminData from '../../hooks/useAdminData'
import useAsync from '../../hooks/useAsync'
import useCategories from '../../hooks/useCategories'
import { adminOrderPath, PATHS } from '../../routes/paths'
import { fetchAdminCounts } from '../../services/adminService'
import { ORDER_STATUS } from '../../utils/constants'
import { formatDateTime } from '../../utils/formatters'
import { formatPaise, getFarmerPart, getOverallStatus, shortOrderId } from '../../utils/orders'
import { t, tp } from '../../i18n'

/** Delivered value (cash collected) across the loaded orders. */
function deliveredValue(orders) {
  let paise = 0
  orders.forEach((order) => {
    order.farmerIds.forEach((farmerId) => {
      const part = getFarmerPart(order, farmerId)
      if (part.status === ORDER_STATUS.DELIVERED) paise += part.subtotalPaise
    })
  })
  return paise
}

export default function AdminOverviewPage() {
  const { orders, ordersLoading, ordersError } = useAdminData()
  const { categories, loading: categoriesLoading } = useCategories()
  const counts = useAsync(fetchAdminCounts, 'counts')

  const open = orders.filter((o) =>
    ['placed', 'confirmed', 'shipped', 'processing'].includes(getOverallStatus(o)),
  ).length

  return (
    <div className="space-y-6">
      <PageMeta title={t('Admin')} noIndex />
      <PageHeader title={t('Admin overview')} subtitle={t('The whole marketplace at a glance.')} />

      {!categoriesLoading && categories.length === 0 && (
        <Alert variant="warning" title={t('No product categories yet')}>
          {t('Farmers can’t list products until categories exist.')}{' '}
          <Link to={PATHS.ADMIN_CATEGORIES} className="font-semibold underline">{t('Set up categories')}</Link>
        </Alert>
      )}

      {counts.error ? (
        <LoadError error={counts.error} onRetry={counts.reload} />
      ) : counts.loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t('Customers')} value={counts.data.customers} />
            <StatCard label={t('Farmers')} value={counts.data.farmers} hint={counts.data.suspendedFarmers ? t('{count} suspended', { count: counts.data.suspendedFarmers }) : t('all active')} />
            <StatCard label={t('Listed products')} value={counts.data.listedProducts} tone="brand" hint={t('{count} hidden', { count: counts.data.hiddenProducts })} />
            <StatCard label={t('Orders')} value={counts.data.orders} hint={tp(counts.data.newMessages, '{count} new message', '{count} new messages')} />
          </div>
        </>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('Recent orders')}
        </h2>
        {ordersError ? (
          <LoadError error={ordersError} />
        ) : ordersLoading ? (
          <Spinner />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label={t('Delivered value')} value={formatPaise(deliveredValue(orders))} tone="brand" hint={tp(orders.length, 'Last {count} order', 'Last {count} orders')} />
              <StatCard label={t('Open orders')} value={open} tone="warning" />
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">{t('No orders yet.')}</p>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
                {orders.slice(0, 8).map((order) => (
                  <li key={order.id}>
                    <Link to={adminOrderPath(order.id)} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-cream-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          #{shortOrderId(order.id)} · {order.address?.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <OrderStatusBadge status={getOverallStatus(order)} />
                        <span className="text-sm font-semibold">{formatPaise(order.totalPaise)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  )
}
