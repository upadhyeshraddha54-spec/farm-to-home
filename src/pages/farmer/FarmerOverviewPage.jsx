import { Link } from 'react-router'
import FarmerStatusNotice from '../../components/farmer/FarmerStatusNotice'
import PageHeader from '../../components/farmer/PageHeader'
import StockBadge from '../../components/farmer/StockBadge'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import useAuth from '../../hooks/useAuth'
import useFarmerData from '../../hooks/useFarmerData'
import { farmerProductEditPath, PATHS } from '../../routes/paths'
import { getUnitLabel } from '../../utils/constants'
import { getLowStockProducts, getProductStats, getSalesStats, getTopProducts } from '../../utils/farmerStats'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatPrice } from '../../utils/formatters'
import { formatPaise } from '../../utils/orders'
import PageMeta from '../../components/common/PageMeta'
import { t, tp } from '../../i18n'

function SetupChecklist({ hasFarm, hasProducts }) {
  const steps = [
    { done: hasFarm, label: t('Complete your farm profile'), to: PATHS.FARMER_PROFILE },
    { done: hasProducts, label: t('Add your first product'), to: PATHS.FARMER_PRODUCT_NEW },
  ]
  return (
    <section className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t('Get your store ready')}</h2>
      <ol className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step.done ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
              aria-hidden="true"
            >
              {step.done ? '✓' : '•'}
            </span>
            {step.done ? (
              <span className="text-gray-500 line-through">{step.label}</span>
            ) : (
              <Link to={step.to} className="font-medium text-brand-700 hover:underline">
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function FarmerOverviewPage() {
  const { profile } = useAuth()
  const { uid, canSell, farmerStatus, farm, products, productsLoading, productsError, orders, ordersLoading, ordersError } =
    useFarmerData()

  const productStats = getProductStats(products)
  const sales = getSalesStats(orders, uid)
  const topProducts = getTopProducts(orders, uid)
  const lowStock = getLowStockProducts(products).slice(0, 5)
  const needsSetup = !farm || products.length === 0

  return (
    <div className="space-y-6">
      <PageMeta title={t('Farmer dashboard')} noIndex />
      <PageHeader
        title={t('Welcome, {name}', { name: profile.name.split(' ')[0] })}
        subtitle={farm ? farm.farmName : t('Here’s how your farm store is doing.')}
        actions={
          canSell && farm ? <Button to={PATHS.FARMER_PRODUCT_NEW}>{t('+ Add product')}</Button> : null
        }
      />

      <FarmerStatusNotice status={farmerStatus} />
      {canSell && needsSetup && (
        <SetupChecklist hasFarm={Boolean(farm)} hasProducts={products.length > 0} />
      )}

      {/* Products */}
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('Products')}
        </h2>
        {productsError ? (
          <Alert variant="error">{getFriendlyErrorMessage(productsError)}</Alert>
        ) : productsLoading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t('Total products')} value={productStats.total} />
            <StatCard label={t('Listed in store')} value={productStats.listed} tone="brand" />
            <StatCard label={t('Low stock')} value={productStats.lowStock} tone="warning" />
            <StatCard label={t('Out of stock')} value={productStats.outOfStock} tone="danger" />
          </div>
        )}
      </section>

      {sales.newOrders > 0 && (
        <Alert variant="warning" title={tp(sales.newOrders, '{count} new order waiting', '{count} new orders waiting')}>
          <Link to={PATHS.FARMER_ORDERS} className="font-semibold underline">
            {t('Review and confirm them')}
          </Link>
        </Alert>
      )}

      {/* Sales — calculated from real orders (this farm's part of each order) */}
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('Sales')}
        </h2>
        {ordersError ? (
          <Alert variant="error">{getFriendlyErrorMessage(ordersError)}</Alert>
        ) : ordersLoading ? (
          <Spinner />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label={t('Revenue')} value={formatPaise(sales.revenuePaise)} tone="brand" hint={t('Delivered (cash collected)')} />
              <StatCard label={t('Last 30 days')} value={formatPaise(sales.last30DaysPaise)} hint={t('Delivered')} />
              <StatCard label={t('Units sold')} value={sales.unitsSold} hint={t('Delivered')} />
              <StatCard label={t('Open orders')} value={sales.openOrders} tone="warning" hint={t('{count} total, excl. cancelled', { count: sales.totalOrders })} />
            </div>
            {sales.totalOrders === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                {t('No orders yet. Your sales will appear here as soon as customers start buying.')}
              </p>
            ) : (
              topProducts.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
                  <h3 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
                    {t('Best sellers')}
                  </h3>
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 text-left text-xs text-gray-500 uppercase">
                      <tr>
                        <th scope="col" className="px-5 py-2 font-medium">{t('Product')}</th>
                        <th scope="col" className="px-5 py-2 text-right font-medium">{t('Units ordered')}</th>
                        <th scope="col" className="px-5 py-2 text-right font-medium">{t('Delivered revenue')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topProducts.map((p) => (
                        <tr key={p.productId}>
                          <td className="px-5 py-2 text-gray-900">{p.name}</td>
                          <td className="px-5 py-2 text-right">{p.units}</td>
                          <td className="px-5 py-2 text-right">{formatPaise(p.revenuePaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </section>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <section className="rounded-xl border border-cream-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
            {t('Needs restocking')}
          </h2>
          <ul className="divide-y divide-gray-100">
            {lowStock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(product.price)} {getUnitLabel(product.unit)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StockBadge stock={product.stock} />
                  {canSell && (
                    <Link
                      to={farmerProductEditPath(product.id)}
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      {t('Update')}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
