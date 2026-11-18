import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadError from '../../components/common/LoadError'
import FarmAvatar from '../../components/farm/FarmAvatar'
import DemoBadge from '../../components/product/DemoBadge'
import RatingStars from '../../components/product/RatingStars'
import ProductGrid, { ProductGridSkeleton } from '../../components/product/ProductGrid'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import useAsync from '../../hooks/useAsync'
import { PATHS } from '../../routes/paths'
import { fetchFarmPage } from '../../services/marketplaceService'
import { getCategoryLabel, getStateLabel } from '../../utils/constants'
import { formatDate } from '../../utils/formatters'
import { countByCategory } from '../../utils/marketplace'
import { localized, t } from '../../i18n'

/** Category tabs for a farm's products ("All", "Fruits 3", …). */
function CategoryTabs({ counts, active, onSelect, total }) {
  const tabs = [{ value: '', label: t('All'), count: total }].concat(
    Object.entries(counts).map(([value, count]) => ({ value, label: getCategoryLabel(value), count })),
  )
  if (tabs.length <= 2) return null

  return (
    <div className="mb-4 flex gap-2 relative overflow-x-auto pb-1" role="group" aria-label={t('Filter by category')}>
      {tabs.map((tab) => (
        <button
          key={tab.value || 'all'}
          type="button"
          aria-pressed={active === tab.value}
          onClick={() => onSelect(tab.value)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.value
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
          }`}
        >
          {tab.label} <span className="opacity-70">{tab.count}</span>
        </button>
      ))}
    </div>
  )
}

function FarmProducts({ products }) {
  const [category, setCategory] = useState('')
  const counts = useMemo(() => countByCategory(products), [products])
  const shown = category ? products.filter((p) => p.category === category) : products

  if (!products.length) {
    return (
      <EmptyState
        title={t('Everything is sold out right now')}
        message={t('This farm’s products are out of stock at the moment. Please check back soon.')}
      />
    )
  }

  return (
    <>
      <CategoryTabs counts={counts} active={category} onSelect={setCategory} total={products.length} />
      <ProductGrid products={shown} />
    </>
  )
}

export default function FarmPage() {
  const { farmId } = useParams()
  const page = useAsync(fetchFarmPage, farmId)

  if (page.error) {
    return (
      <Container>
        <LoadError error={page.error} onRetry={page.reload} />
      </Container>
    )
  }

  if (!page.loading && !page.data) {
    return (
      <Container className="py-10">
        <EmptyState
          title={t('Farm not found')}
          message={t('This farm doesn’t exist or isn’t selling on Farm To Home right now.')}
          action={<Button to={PATHS.FARMS}>{t('See all farmers')}</Button>}
        />
      </Container>
    )
  }

  const farm = page.data?.farm
  const location = farm ? [farm.city, getStateLabel(farm.state)].filter(Boolean).join(', ') : ''
  const farmName = localized(farm, 'farmName')

  return (
    <Container className="py-6">
      <Breadcrumbs
        items={[
          { label: t('Home'), to: PATHS.HOME },
          { label: t('Our farmers'), to: PATHS.FARMS },
          { label: farmName || t('Farm') },
        ]}
      />

      {page.loading ? (
        <>
          <div className="mb-6 h-32 animate-pulse rounded-2xl bg-cream-200" />
          <ProductGridSkeleton count={5} />
        </>
      ) : (
        <>
          <section className="mb-8 overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
            <div className="h-20 bg-linear-to-r from-brand-700 to-brand-500 sm:h-24" />
            <div className="px-5 pb-5 sm:px-6">
              {/* Only the avatar overlaps the green banner; the text sits below it. */}
              <div className="-mt-8 w-fit rounded-full ring-4 ring-white sm:-mt-10">
                <FarmAvatar name={farmName} size="lg" />
              </div>
              <div className="mt-3">
                <div className="min-w-0">
                  <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-gray-900">
                    {farmName}
                    {farm.isDemo && <DemoBadge />}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {location}
                    {farm.createdAt && ` · ${t('Selling since {date}', { date: formatDate(farm.createdAt) })}`}
                  </p>
                  <RatingStars value={farm.rating?.average ?? 0} count={farm.rating?.count ?? 0} showEmpty className="mt-1" />
                </div>
              </div>
              {farm.description && (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-gray-700">
                  {localized(farm, 'description')}
                </p>
              )}
            </div>
          </section>

          <h2 className="mb-3 text-lg font-bold text-gray-900">
            {t('Products from {farm}', { farm: farmName })}{' '}
            <span className="font-normal text-gray-500">({page.data.products.length})</span>
          </h2>
          <FarmProducts key={farmId} products={page.data.products} />
        </>
      )}
    </Container>
  )
}
