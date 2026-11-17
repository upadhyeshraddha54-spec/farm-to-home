import { getUnitLabel } from '../../utils/constants'
import { formatPrice, getDiscountPercent } from '../../utils/formatters'

/** "₹40 per kg  ₹50  20% off" — size "lg" for product pages. */
export default function PriceTag({ price, mrp, unit, size = 'md' }) {
  const discount = getDiscountPercent(price, mrp)
  const large = size === 'lg'

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-bold text-gray-900 ${large ? 'text-3xl' : 'text-base'}`}>
        {formatPrice(price)}
      </span>
      <span className={`text-gray-500 ${large ? 'text-base' : 'text-xs'}`}>{getUnitLabel(unit)}</span>
      {discount > 0 && (
        <>
          <span className={`text-gray-400 line-through ${large ? 'text-base' : 'text-xs'}`}>
            <span className="sr-only">MRP </span>
            {formatPrice(mrp)}
          </span>
          <span className={`font-semibold text-brand-700 ${large ? 'text-base' : 'text-xs'}`}>
            {discount}% off
          </span>
        </>
      )}
    </div>
  )
}
