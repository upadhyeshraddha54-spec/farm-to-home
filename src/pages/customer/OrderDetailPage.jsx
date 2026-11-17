import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import { AddressBlock, OrderShipments, PaymentBlock } from '../../components/order/OrderParts'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useLiveData from '../../hooks/useLiveData'
import useToast from '../../hooks/useToast'
import { PATHS, productPath } from '../../routes/paths'
import { ORDER_STATUS } from '../../utils/constants'
import { cancelOrder, subscribeToOrder } from '../../services/orderService'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDateTime } from '../../utils/formatters'
import { canCustomerCancel, getOverallStatus, shortOrderId } from '../../utils/orders'

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const toast = useToast()
  const order = useLiveData(subscribeToOrder, orderId)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  async function handleCancel() {
    setCancelling(true)
    try {
      await cancelOrder(order.data)
      toast.success('Your order has been cancelled.')
    } catch (error) {
      toast.error(
        error?.code === 'permission-denied'
          ? 'This order can no longer be cancelled because a farmer has already confirmed it.'
          : getFriendlyErrorMessage(error),
      )
    } finally {
      setCancelling(false)
      setConfirming(false)
    }
  }

  if (order.error) return <Container><LoadError error={order.error} /></Container>
  if (order.loading) return <Container><Spinner fullPage /></Container>
  if (!order.data) {
    return (
      <Container className="py-10">
        <EmptyState
          title="Order not found"
          message="This order doesn’t exist or belongs to another account."
          action={<Button to={PATHS.ORDERS}>Your orders</Button>}
        />
      </Container>
    )
  }

  const data = order.data
  const number = shortOrderId(data.id)

  return (
    <Container className="max-w-4xl py-6">
      <PageMeta title={`Order #${number}`} noIndex />
      <Breadcrumbs items={[{ label: 'Your orders', to: PATHS.ORDERS }, { label: `Order #${number}` }]} />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-gray-900">
            Order #{number} <OrderStatusBadge status={getOverallStatus(data)} />
          </h1>
          <p className="mt-1 text-sm text-gray-600">Placed {formatDateTime(data.createdAt)}</p>
        </div>
        {canCustomerCancel(data) && (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Cancel order
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <OrderShipments
          order={data}
          itemAction={(item, group) =>
            group.status === ORDER_STATUS.DELIVERED ? (
              <Link
                to={`${productPath(item.productId)}#reviews`}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Rate this product
              </Link>
            ) : null
          }
        />
        <div className="space-y-4">
          <PaymentBlock order={data} />
          <AddressBlock address={data.address} />
          <p className="text-sm text-gray-600">
            Need help with this order?{' '}
            <Link
              to={`${PATHS.CONTACT}?order=${encodeURIComponent(data.id)}`}
              className="font-semibold text-brand-700 hover:underline"
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Cancel this order?"
        message="All items will be cancelled and nothing will be delivered. You can cancel only until a farmer confirms the order."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        busy={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirming(false)}
      />
    </Container>
  )
}
