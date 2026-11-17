import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import useLiveData from '../../hooks/useLiveData'
import { orderPath, PATHS } from '../../routes/paths'
import { subscribeToCustomerOrders } from '../../services/orderService'
import { formatDate } from '../../utils/formatters'
import { formatPaise, getOverallStatus, shortOrderId } from '../../utils/orders'

export default function OrdersPage() {
  const { user } = useAuth()
  const orders = useLiveData(subscribeToCustomerOrders, user.uid)

  return (
    <Container className="max-w-3xl py-6">
      <PageMeta title="Your orders" noIndex />
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Your orders</h1>

      {orders.error ? (
        <LoadError error={orders.error} />
      ) : orders.loading ? (
        <Spinner fullPage />
      ) : orders.data.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="When you place an order it will appear here, and you can track each shipment."
          action={<Button to={PATHS.PRODUCTS}>Start shopping</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {orders.data.map((order) => {
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)
            return (
              <li key={order.id}>
                <Link
                  to={orderPath(order.id)}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-cream-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Order #{shortOrderId(order.id)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'} from{' '}
                      {order.farmerIds.length} {order.farmerIds.length === 1 ? 'farm' : 'farms'}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-700">
                      {order.items.map((i) => i.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={getOverallStatus(order)} />
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatPaise(order.totalPaise)}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Container>
  )
}
