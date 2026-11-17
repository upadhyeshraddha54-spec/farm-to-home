import { useMemo, useState } from 'react'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import FarmCard from '../../components/farm/FarmCard'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import useAsync from '../../hooks/useAsync'
import { PATHS } from '../../routes/paths'
import { fetchStorefront } from '../../services/marketplaceService'

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

const SORTS = {
  rating: {
    label: 'Top rated',
    compare: (a, b) =>
      b.rating.average - a.rating.average || b.rating.count - a.rating.count || b.productCount - a.productCount,
  },
  products: { label: 'Most products', compare: (a, b) => b.productCount - a.productCount },
  name: { label: 'Name A–Z', compare: (a, b) => a.farmName.localeCompare(b.farmName) },
}

export default function FarmsPage() {
  const storefront = useAsync(fetchStorefront, 'storefront')
  const farms = useMemo(() => storefront.data?.farms ?? [], [storefront.data])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [sort, setSort] = useState('rating')

  const cities = useMemo(
    () => [...new Set(farms.map((f) => f.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [farms],
  )

  const term = search.trim().toLowerCase()
  const shown = farms
    .filter((f) => !city || f.city === city)
    .filter(
      (f) =>
        !term ||
        f.farmName.toLowerCase().includes(term) ||
        f.city?.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term),
    )
    .sort(SORTS[sort].compare)

  return (
    <Container className="py-6">
      <PageMeta title="Our farmers" description="Choose the farms you buy from — see each farm's location, ratings and products." />
      <Breadcrumbs items={[{ label: 'Home', to: PATHS.HOME }, { label: 'Our farmers' }]} />
      <h1 className="text-2xl font-bold text-gray-900">Our farmers</h1>
      <p className="mt-1 mb-5 text-sm text-gray-600">
        You choose who you buy from. Every product comes straight from one of these farms, and
        you can order from several farms in one go.
      </p>

      {farms.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label htmlFor="farm-search" className="sr-only">Search farms</label>
          <input
            id="farm-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farm or place"
            className="h-10 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
          <label htmlFor="farm-city" className="sr-only">Location</label>
          <select
            id="farm-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm"
          >
            <option value="">All locations</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label htmlFor="farm-sort" className="sr-only">Sort by</label>
          <select
            id="farm-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm"
          >
            {Object.entries(SORTS).map(([value, { label }]) => (
              <option key={value} value={value}>Sort: {label}</option>
            ))}
          </select>
          <p className="text-sm text-gray-600" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'farm' : 'farms'}
          </p>
        </div>
      )}

      {storefront.error ? (
        <LoadError error={storefront.error} onRetry={storefront.reload} />
      ) : storefront.loading ? (
        <ul className={GRID} aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="h-40 animate-pulse rounded-xl bg-cream-200" />
          ))}
        </ul>
      ) : farms.length === 0 ? (
        <EmptyState
          title="No farmers are selling yet"
          message="Farms appear here once they list their first product."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          title="No farms match"
          message="Try a different search or location."
        />
      ) : (
        <ul className={GRID}>
          {shown.map((farm) => (
            <li key={farm.id}>
              <FarmCard farm={farm} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
