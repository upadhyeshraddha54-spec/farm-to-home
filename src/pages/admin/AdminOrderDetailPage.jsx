import { useParams } from 'react-router'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import { AddressBlock, OrderShipments, PaymentBlock } from '../../components/order/OrderParts'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import ShipmentActions from '../../components/order/ShipmentActions'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useLiveData from '../../hooks/useLiveData'
import { PATHS } from '../../routes/paths'
import { subscribeToOrder } from '../../services/orderService'
import { formatDateTime } from '../../utils/formatters'
import { getOverallStatus, shortOrderId } from '../../utils/orders'

export default function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const order = useLiveData(subscribeToOrder, orderId)

  if (order.error) return <LoadError error={order.error} />
  if (order.loading) return <Spinner fullPage />
  if (!order.data) {
    return (
      <EmptyState
        title="Order not found"
        action={<Button to={PATHS.ADMIN_ORDERS}>All orders</Button>}
      />
    )
  }

  const data = order.data
  const number = shortOrderId(data.id)

  return (
    <div className="max-w-5xl">
      <PageMeta title={`Order #${number}`} noIndex />
      <Breadcrumbs items={[{ label: 'Orders', to: PATHS.ADMIN_ORDERS }, { label: `Order #${number}` }]} />
      <div className="mb-5">
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-gray-900">
          Order #{number} <OrderStatusBadge status={getOverallStatus(data)} />
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Placed {formatDateTime(data.createdAt)} by{' '}
          <a href={`mailto:${data.customerEmail}`} className="font-medium text-brand-700 hover:underline">
            {data.customerEmail}
          </a>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Admins can move any shipment forward — useful for demo farms (which have no login) or support cases.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <OrderShipments
          order={data}
          renderActions={(part) => (
            <ShipmentActions orderId={data.id} farmerId={part.farmerId} status={part.status} />
          )}
        />
        <div className="space-y-4">
          <PaymentBlock order={data} />
          <AddressBlock address={data.address} />
        </div>
      </div>
    </div>
  )
}
