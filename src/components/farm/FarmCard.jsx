import { Link } from 'react-router'
import { farmPath } from '../../routes/paths'
import { getCategoryLabel, getStateLabel } from '../../utils/constants'
import DemoBadge from '../product/DemoBadge'
import RatingStars from '../product/RatingStars'
import FarmAvatar from './FarmAvatar'
import { localized, tp } from '../../i18n'

/** Farm tile for the farmers directory and the home page. Links to the farm page. */
export default function FarmCard({ farm }) {
  return (
    <Link
      to={farmPath(farm.id)}
      className="flex h-full flex-col rounded-xl border border-cream-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <FarmAvatar name={localized(farm, 'farmName')} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-gray-900">
            <span className="truncate">{localized(farm, 'farmName')}</span>
            {farm.isDemo && <DemoBadge />}
          </p>
          <p className="truncate text-sm text-gray-500">
            {[farm.city, getStateLabel(farm.state)].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <RatingStars value={farm.rating?.average ?? 0} count={farm.rating?.count ?? 0} size="sm" showEmpty />
      </div>
      {farm.categories?.length > 0 && (
        <p className="mt-3 line-clamp-2 text-xs text-gray-600">
          {farm.categories.map(getCategoryLabel).join(' · ')}
        </p>
      )}
      {farm.productCount != null && (
        <p className="mt-auto pt-3 text-sm font-semibold text-brand-700">
          {tp(farm.productCount, '{count} product', '{count} products')} →
        </p>
      )}
    </Link>
  )
}
