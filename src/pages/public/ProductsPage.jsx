import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadError from '../../components/common/LoadError'
import FilterPanel from '../../components/product/FilterPanel'
import ProductGrid, { ProductGridSkeleton } from '../../components/product/ProductGrid'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import useAsync from '../../hooks/useAsync'
import useCategories from '../../hooks/useCategories'
import { PATHS } from '../../routes/paths'
import { fetchCatalog } from '../../services/marketplaceService'
import { getCategoryLabel } from '../../utils/constants'
import { formatPrice } from '../../utils/formatters'
import {
  countByCategory,
  filterProducts,
  filtersToParams,
  findPriceRange,
  parseFilters,
  SORT_OPTIONS,
} from '../../utils/marketplace'
import { t, tp } from '../../i18n'

const PAGE_SIZE = 40

function priceLabel(min, max) {
  const preset = findPriceRange(min, max)
  if (preset) return t(preset.label)
  if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)}`
  if (min != null) return t('{price} and above', { price: formatPrice(min) })
  return t('Under {price}', { price: formatPrice(max) })
}

/** Removable chips for the active filters. */
function ActiveFilters({ filters, onChange, onClearAll }) {
  const chips = []
  if (filters.q) chips.push({ label: `“${filters.q}”`, clear: { q: '' } })
  if (filters.category) {
    chips.push({ label: getCategoryLabel(filters.category), clear: { category: '' } })
  }
  if (filters.min != null || filters.max != null) {
    chips.push({ label: priceLabel(filters.min, filters.max), clear: { min: null, max: null } })
  }
  if (!chips.length) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onChange(chip.clear)}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-800 hover:bg-brand-100"
          aria-label={t('Remove filter {filter}', { filter: chip.label })}
        >
          {chip.label}
          <span aria-hidden="true">×</span>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          {t('Clear all')}
        </button>
      )}
    </div>
  )
}

/** Results with "Show more" — renders products in pages of PAGE_SIZE. */
function Results({ products }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  return (
    <>
      <ProductGrid products={products.slice(0, visible)} />
      {visible < products.length && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
            {t('Show more ({count} left)', { count: products.length - visible })}
          </Button>
        </div>
      )}
    </>
  )
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Recomputed only when the URL's query string changes.
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const [showFilters, setShowFilters] = useState(false)
  const { activeCategories } = useCategories()
  const catalog = useAsync(fetchCatalog, 'catalog')

  const products = catalog.data
  const results = useMemo(
    () => (products ? filterProducts(products, filters) : []),
    [products, filters],
  )
  // Sidebar categories: the active ones from the categories collection, plus any
  // category that products are actually listed in (so filtering works even if a
  // category document is missing, hidden or still loading), plus the selected one.
  const filterCategories = useMemo(() => {
    const values = activeCategories.map((c) => c.value)
    if (products) Object.keys(countByCategory(products)).forEach((v) => values.push(v))
    if (filters.category) values.push(filters.category)
    return [...new Set(values)].filter(Boolean).map((value) => ({ value, label: getCategoryLabel(value) }))
  }, [activeCategories, products, filters.category])

  // Category counts for the current search + price (ignoring the category itself).
  const categoryCounts = useMemo(
    () => (products ? countByCategory(filterProducts(products, { ...filters, category: '' })) : {}),
    [products, filters],
  )

  function updateFilters(changes) {
    setSearchParams(filtersToParams({ ...filters, ...changes }))
  }

  const clearAll = () => setSearchParams(new URLSearchParams())
  const activeFilterCount =
    (filters.category ? 1 : 0) + (filters.min != null || filters.max != null ? 1 : 0)

  const title = filters.q
    ? t('Results for “{query}”', { query: filters.q })
    : filters.category
      ? getCategoryLabel(filters.category)
      : t('All products')

  return (
    <Container className="py-6">
      <Breadcrumbs
        items={[
          { label: t('Home'), to: PATHS.HOME },
          filters.category || filters.q
            ? { label: t('All products'), to: PATHS.PRODUCTS }
            : { label: t('All products') },
          ...(filters.category || filters.q ? [{ label: title }] : []),
        ]}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters: always visible on large screens, toggled on smaller ones */}
        <aside
          id="product-filters"
          className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-64 lg:shrink-0`}
        >
          <FilterPanel
            filters={filters}
            categories={filterCategories}
            categoryCounts={categoryCounts}
            onChange={updateFilters}
          />
        </aside>

        <section className="min-w-0 flex-1" aria-labelledby="results-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 id="results-title" className="text-xl font-bold text-gray-900 sm:text-2xl">
                {title}
              </h1>
              {products && (
                <p className="text-sm text-gray-600" aria-live="polite">
                  {tp(results.length, '{count} product', '{count} products')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                aria-expanded={showFilters}
                aria-controls="product-filters"
                onClick={() => setShowFilters((v) => !v)}
              >
                {showFilters ? t('Hide filters') : t('Filters')}
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>
              <label htmlFor="sort" className="sr-only">
                {t('Sort by')}
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              >
                {SORT_OPTIONS.filter((o) => o.value !== 'relevance' || filters.q).map((option) => (
                  <option key={option.value} value={option.value}>
                    {t('Sort: {option}', { option: t(option.label) })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ActiveFilters filters={filters} onChange={updateFilters} onClearAll={clearAll} />

          {catalog.error ? (
            <LoadError error={catalog.error} onRetry={catalog.reload} />
          ) : catalog.loading ? (
            <ProductGridSkeleton count={10} />
          ) : products.length === 0 ? (
            <EmptyState
              title={t('No products in the store yet')}
              message={t('Farmers haven’t listed any products yet. Please check back soon.')}
            />
          ) : results.length === 0 ? (
            <EmptyState
              title={t('No products match your filters')}
              message={t('Try a different search word, another category or a wider price range.')}
              action={<Button onClick={clearAll}>{t('Clear all filters')}</Button>}
            />
          ) : (
            // key: start from the first page whenever the filters change
            <Results key={searchParams.toString()} products={results} />
          )}
        </section>
      </div>
    </Container>
  )
}
