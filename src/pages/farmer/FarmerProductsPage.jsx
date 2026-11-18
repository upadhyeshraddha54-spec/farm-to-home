import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import FarmerStatusNotice from '../../components/farmer/FarmerStatusNotice'
import PageHeader from '../../components/farmer/PageHeader'
import StockBadge from '../../components/farmer/StockBadge'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Switch from '../../components/ui/Switch'
import useFarmerData from '../../hooks/useFarmerData'
import { farmerProductEditPath, PATHS, productPath } from '../../routes/paths'
import { getOptimizedImageUrl } from '../../services/cloudinaryService'
import { deleteProduct, setProductListed } from '../../services/productService'
import { getCategoryLabel, getUnitLabel } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatPrice } from '../../utils/formatters'
import { t, tp, tx } from '../../i18n'

export default function FarmerProductsPage() {
  const location = useLocation()
  const { canSell, farmerStatus, products, productsLoading, productsError } = useFarmerData()

  const [togglingId, setTogglingId] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')
  // Success message passed from the add/edit pages.
  const notice = location.state?.notice

  async function handleToggle(product, isActive) {
    setActionError('')
    setTogglingId(product.id)
    try {
      await setProductListed(product.id, isActive)
    } catch (error) {
      setActionError(getFriendlyErrorMessage(error))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    setActionError('')
    setDeleting(true)
    try {
      await deleteProduct(toDelete.id)
      setToDelete(null)
    } catch (error) {
      setActionError(getFriendlyErrorMessage(error))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('My products')}
        subtitle={tp(products.length, '{count} product', '{count} products')}
        actions={canSell ? <Button to={PATHS.FARMER_PRODUCT_NEW}>{t('+ Add product')}</Button> : null}
      />

      <FarmerStatusNotice status={farmerStatus} className="mb-6" />
      {notice && <Alert variant="success" className="mb-4">{notice}</Alert>}
      {actionError && <Alert variant="error" className="mb-4">{actionError}</Alert>}

      {productsError ? (
        <Alert variant="error">{getFriendlyErrorMessage(productsError)}</Alert>
      ) : productsLoading ? (
        <Spinner fullPage />
      ) : products.length === 0 ? (
        <EmptyState
          title={t('No products yet')}
          message={
            canSell
              ? t('Add your first product so customers can start buying from your farm.')
              : t('You can add products again once your account is reinstated.')
          }
          action={canSell ? <Button to={PATHS.FARMER_PRODUCT_NEW}>{t('+ Add product')}</Button> : null}
        />
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
          {products.map((product) => {
            const cover = product.images?.[0]?.url
            return (
              <li key={product.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {cover ? (
                    <img
                      src={getOptimizedImageUrl(cover, { width: 128, height: 128 })}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-cream-200" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{getCategoryLabel(product.category)}</p>
                    {product.hiddenBy && (
                      <p className="mt-0.5 text-xs font-semibold text-red-600">
                        {product.hiddenBy === 'admin' ? t('Hidden by admin') : t('Hidden while your account is suspended')}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-800">
                      <strong>{formatPrice(product.price)}</strong>{' '}
                      <span className="text-gray-500">{getUnitLabel(product.unit)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                  <StockBadge stock={product.stock} />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(product.isActive)}
                      onChange={(value) => handleToggle(product, value)}
                      disabled={!canSell || Boolean(product.hiddenBy) || togglingId === product.id}
                      label={product.isActive ? t('Listed') : t('Hidden')}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {product.isActive && (
                      <Link
                        to={productPath(product.id)}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        {t('View')}
                      </Link>
                    )}
                    {canSell && (
                      <Link
                        to={farmerProductEditPath(product.id)}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                      >
                        {t('Edit')}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setToDelete(product)}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      {t('Delete')}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('Delete this product?')}
        message={
          <>
            {tx('{product} will be permanently removed from your store. This can’t be undone. To hide it temporarily, switch it to “Hidden” instead.', {
              product: <strong>{toDelete?.name}</strong>,
            })}
          </>
        }
        confirmLabel={t('Delete product')}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
