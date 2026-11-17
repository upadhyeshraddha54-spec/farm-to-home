import { Link } from 'react-router'
import { productPath } from '../../routes/paths'
import { getOptimizedImageUrl } from '../../services/cloudinaryService'
import { getUnitLabel } from '../../utils/constants'
import { formatPaise, groupItemsByFarm } from '../../utils/orders'
import OrderStatusBadge from './OrderStatusBadge'
import ShipmentTimeline from './ShipmentTimeline'

/** The product lines of an order (or of one farm's part of it). */
export function OrderItems({ items, linkToProducts = true, itemAction }) {
  return (
    <ul className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item.productId} className="flex items-center gap-3 py-2">
          {item.image ? (
            <img
              src={getOptimizedImageUrl(item.image, { width: 96, height: 96 })}
              alt=""
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-md bg-cream-200" />
          )}
          <div className="min-w-0 flex-1 text-sm">
            {linkToProducts ? (
              <Link to={productPath(item.productId)} className="font-medium text-gray-900 hover:text-brand-700">
                {item.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-900">{item.name}</p>
            )}
            <p className="text-xs text-gray-500">
              {item.quantity} × {formatPaise(item.unitPricePaise)} {getUnitLabel(item.unit)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-gray-900">{formatPaise(item.lineTotalPaise)}</p>
            {itemAction?.(item)}
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * One card per farm ("shipment") with its status, timeline and items.
 * `renderActions(part)` can add buttons (farmer/admin pages).
 */
export function OrderShipments({ order, renderActions, linkToProducts = true, itemAction }) {
  const groups = groupItemsByFarm(order)
  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <section key={group.farmerId} className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Shipment {index + 1} of {groups.length} · {group.farmName}
            </h3>
            <OrderStatusBadge status={group.status} />
          </div>
          <ShipmentTimeline status={group.status} timestamps={group.timestamps} />
          <div className="mt-3">
            <OrderItems
              items={group.items}
              linkToProducts={linkToProducts}
              itemAction={itemAction ? (item) => itemAction(item, group) : undefined}
            />
          </div>
          {renderActions && <div className="mt-3 border-t border-gray-100 pt-3">{renderActions(group)}</div>}
        </section>
      ))}
    </div>
  )
}

/** Delivery address block. */
export function AddressBlock({ address, title = 'Delivery address' }) {
  if (!address) return null
  return (
    <section className="rounded-xl border border-cream-200 bg-white p-4 text-sm shadow-sm sm:p-5">
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <address className="leading-relaxed text-gray-700 not-italic">
        {address.fullName}
        <br />
        {address.line1}
        {address.line2 && <>, {address.line2}</>}
        <br />
        {address.landmark && (
          <>
            Near {address.landmark}
            <br />
          </>
        )}
        {address.city}, {address.state} – {address.pincode}
        <br />
        Phone: {address.phone}
      </address>
    </section>
  )
}

/** Totals + payment method for a placed order. */
export function PaymentBlock({ order }) {
  return (
    <section className="rounded-xl border border-cream-200 bg-white p-4 text-sm shadow-sm sm:p-5">
      <h3 className="mb-2 font-semibold text-gray-900">Payment</h3>
      <dl className="space-y-1.5">
        <div className="flex justify-between">
          <dt className="text-gray-600">Items</dt>
          <dd>{formatPaise(order.subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Delivery</dt>
          <dd>{order.deliveryFeePaise ? formatPaise(order.deliveryFeePaise) : 'FREE'}</dd>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-1.5 font-semibold">
          <dt>Order total</dt>
          <dd>{formatPaise(order.totalPaise)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-gray-500">
        Cash on Delivery: pay each farm when its shipment arrives. Cancelled items aren’t charged.
        {order.deliveryFeePaise > 0 &&
          (order.farmerIds.length > 1
            ? ' The delivery fee is paid with shipment 1 (not charged if shipment 1 is cancelled).'
            : ' The delivery fee is paid with the shipment.')}
      </p>
    </section>
  )
}
