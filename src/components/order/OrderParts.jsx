import { Link } from 'react-router'
import { productPath } from '../../routes/paths'
import { getOptimizedImageUrl } from '../../services/cloudinaryService'
import { getStateLabel, getUnitLabel } from '../../utils/constants'
import { formatPaise, groupItemsByFarm } from '../../utils/orders'
import OrderStatusBadge from './OrderStatusBadge'
import ShipmentTimeline from './ShipmentTimeline'
import { t } from '../../i18n'
import useLocalizedNames from '../../hooks/useLocalizedNames'
import { getFarmName, getProductName } from '../../services/nameService'

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
                {getProductName(item.productId, item.name)}
              </Link>
            ) : (
              <p className="font-medium text-gray-900">{getProductName(item.productId, item.name)}</p>
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
  useLocalizedNames(order.items.map((i) => i.productId))
  const groups = groupItemsByFarm(order)
  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <section key={group.farmerId} className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('Shipment {index} of {total}', { index: index + 1, total: groups.length })} · {getFarmName(group.farmerId, group.farmName)}
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
export function AddressBlock({ address, title = t('Delivery address') }) {
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
            {t('Near {landmark}', { landmark: address.landmark })}
            <br />
          </>
        )}
        {address.city}, {getStateLabel(address.state)} – {address.pincode}
        <br />
        {t('Phone: {phone}', { phone: address.phone })}
      </address>
    </section>
  )
}

/** Totals + payment method for a placed order. */
export function PaymentBlock({ order }) {
  return (
    <section className="rounded-xl border border-cream-200 bg-white p-4 text-sm shadow-sm sm:p-5">
      <h3 className="mb-2 font-semibold text-gray-900">{t('Payment')}</h3>
      <dl className="space-y-1.5">
        <div className="flex justify-between">
          <dt className="text-gray-600">{t('Items')}</dt>
          <dd>{formatPaise(order.subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">{t('Delivery')}</dt>
          <dd>{order.deliveryFeePaise ? formatPaise(order.deliveryFeePaise) : t('FREE')}</dd>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-1.5 font-semibold">
          <dt>{t('Order total')}</dt>
          <dd>{formatPaise(order.totalPaise)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-gray-500">
        {t('Cash on Delivery: pay each farm when its shipment arrives. Cancelled items aren’t charged.')}
        {order.deliveryFeePaise > 0 &&
          ' ' +
            (order.farmerIds.length > 1
              ? t('The delivery fee is paid with shipment 1 (not charged if shipment 1 is cancelled).')
              : t('The delivery fee is paid with the shipment.'))}
      </p>
    </section>
  )
}
