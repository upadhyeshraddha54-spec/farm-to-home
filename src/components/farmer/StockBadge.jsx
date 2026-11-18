import { LOW_STOCK_THRESHOLD } from '../../utils/constants'
import { t } from '../../i18n'

/** "Out of stock" / "Low: 3" / "In stock: 40" label. */
export default function StockBadge({ stock }) {
  if (stock === 0) {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        {t('Out of stock')}
      </span>
    )
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        {t('Low: {count}', { count: stock })}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
      {t('In stock: {count}', { count: stock })}
    </span>
  )
}
