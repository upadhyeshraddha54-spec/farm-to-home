import { useState } from 'react'
import useToast from '../../hooks/useToast'
import { updateShipmentStatus } from '../../services/orderService'
import { NEXT_STATUSES, ORDER_STATUS } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

const ACTION_LABELS = {
  confirmed: 'Confirm order',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered (cash collected)',
  cancelled: 'Cancel',
}

const HINTS = {
  placed: 'Confirm when you can fulfil this order, or cancel if you can’t.',
  confirmed: 'Pack the items and mark as shipped when they leave the farm.',
  shipped: 'Mark as delivered once the customer receives the items and pays.',
}

/** Status buttons for ONE farmer's part of an order (farmer or admin). */
export default function ShipmentActions({ orderId, farmerId, status }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const next = NEXT_STATUSES[status] ?? []

  async function move(to) {
    setBusy(true)
    try {
      await updateShipmentStatus(orderId, [farmerId], to)
      toast.success(
        to === ORDER_STATUS.CANCELLED
          ? 'Shipment cancelled. The stock has been added back.'
          : `Marked as ${to}.`,
      )
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setBusy(false)
      setConfirmCancel(false)
    }
  }

  if (!next.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next
        .filter((to) => to !== ORDER_STATUS.CANCELLED)
        .map((to) => (
          <Button key={to} size="sm" onClick={() => move(to)} disabled={busy}>
            {ACTION_LABELS[to]}
          </Button>
        ))}
      {next.includes(ORDER_STATUS.CANCELLED) && (
        <Button size="sm" variant="outline" onClick={() => setConfirmCancel(true)} disabled={busy}>
          {ACTION_LABELS.cancelled}
        </Button>
      )}
      {HINTS[status] && <p className="w-full text-xs text-gray-500">{HINTS[status]}</p>}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this shipment?"
        message="The customer will see it as cancelled and the items go back into your stock. This can’t be undone."
        confirmLabel="Cancel shipment"
        cancelLabel="Keep it"
        busy={busy}
        onConfirm={() => move(ORDER_STATUS.CANCELLED)}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  )
}
