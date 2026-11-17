import { useState } from 'react'
import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import StockBadge from '../../components/farmer/StockBadge'
import DemoBadge from '../../components/product/DemoBadge'
import ProductImage from '../../components/product/ProductImage'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useLiveData from '../../hooks/useLiveData'
import useToast from '../../hooks/useToast'
import { productPath } from '../../routes/paths'
import { deleteProductAsAdmin, setProductHiddenByAdmin, subscribeToAllProducts } from '../../services/adminService'
import { getCategoryLabel, getUnitLabel } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatPrice } from '../../utils/formatters'

const subscribe = (_key, onData, onError) => subscribeToAllProducts(onData, onError)

const FILTERS = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'listed', label: 'Listed', test: (p) => p.isActive },
  { value: 'admin', label: 'Hidden by admin', test: (p) => p.hiddenBy === 'admin' },
  { value: 'suspension', label: 'Hidden (farmer suspended)', test: (p) => p.hiddenBy === 'suspension' },
  { value: 'farmer', label: 'Hidden by farmer', test: (p) => !p.isActive && !p.hiddenBy },
  { value: 'demo', label: 'Demo', test: (p) => p.isDemo },
]

function visibilityLabel(p) {
  if (p.isActive) return <span className="text-brand-700">Listed</span>
  if (p.hiddenBy === 'admin') return <span className="text-red-600">Hidden by admin</span>
  if (p.hiddenBy === 'suspension') return <span className="text-red-600">Farmer suspended</span>
  return <span className="text-gray-500">Hidden by farmer</span>
}

export default function AdminProductsPage() {
  const toast = useToast()
  const products = useLiveData(subscribe, 'all')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState(null) // { type: 'hide'|'release'|'delete', product }
  const [busy, setBusy] = useState(false)

  const term = search.trim().toLowerCase()
  const test = FILTERS.find((f) => f.value === filter).test
  const shown = (products.data ?? [])
    .filter(test)
    .filter((p) => !term || p.name.toLowerCase().includes(term) || p.farmName?.toLowerCase().includes(term))

  async function apply() {
    setBusy(true)
    const { type, product } = dialog
    try {
      if (type === 'delete') await deleteProductAsAdmin(product.id)
      else await setProductHiddenByAdmin(product.id, type === 'hide')
      toast.success(
        type === 'delete' ? 'Product deleted.' : type === 'hide' ? 'Product hidden from the store.' : 'Product listed again.',
      )
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setBusy(false)
      setDialog(null)
    }
  }

  const DIALOGS = {
    hide: { title: 'Hide this product?', message: 'It disappears from the store and the farmer can’t relist it until you release it.', label: 'Hide product' },
    release: { title: 'Release this product?', message: 'It will be listed in the store again.', label: 'Release', variant: 'primary' },
    delete: { title: 'Delete this product?', message: 'It is removed permanently. Past orders keep their details. This can’t be undone.', label: 'Delete' },
  }

  return (
    <div className="max-w-6xl">
      <PageMeta title="Products" noIndex />
      <PageHeader title="Products" subtitle={`${products.data?.length ?? 0} products in total`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input
          id="product-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product or farm"
          className="h-10 w-full max-w-xs rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
        <label htmlFor="product-filter" className="sr-only">Filter</label>
        <select
          id="product-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {products.error ? (
        <LoadError error={products.error} />
      ) : products.loading ? (
        <Spinner fullPage />
      ) : shown.length === 0 ? (
        <EmptyState title="No products found" message="Try a different search or filter." />
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
          {shown.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage product={p} size={96} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    <span className="truncate">{p.name}</span> {p.isDemo && <DemoBadge />}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.farmName} · {getCategoryLabel(p.category)} · {formatPrice(p.price)} {getUnitLabel(p.unit)}
                  </p>
                  <p className="text-xs font-medium">{visibilityLabel(p)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
              <StockBadge stock={p.stock} />
              <div className="flex flex-wrap gap-2">
                {p.isActive && (
                  <Link to={productPath(p.id)} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    View
                  </Link>
                )}
                {p.hiddenBy === 'admin' ? (
                  <Button size="sm" variant="outline" onClick={() => setDialog({ type: 'release', product: p })}>Release</Button>
                ) : (
                  p.isActive && (
                    <Button size="sm" variant="outline" onClick={() => setDialog({ type: 'hide', product: p })}>Hide</Button>
                  )
                )}
                <Button size="sm" variant="danger-ghost" onClick={() => setDialog({ type: 'delete', product: p })}>
                  Delete
                </Button>
              </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog ? DIALOGS[dialog.type].title : ''}
        message={dialog ? <><strong>{dialog.product.name}</strong> — {DIALOGS[dialog.type].message}</> : ''}
        confirmLabel={dialog ? DIALOGS[dialog.type].label : ''}
        confirmVariant={dialog ? DIALOGS[dialog.type].variant ?? 'danger' : 'danger'}
        busy={busy}
        onConfirm={apply}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}
