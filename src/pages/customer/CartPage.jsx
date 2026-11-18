import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import OrderSummary from '../../components/order/OrderSummary'
import PriceTag from '../../components/product/PriceTag'
import ProductImage from '../../components/product/ProductImage'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import QuantityStepper from '../../components/ui/QuantityStepper'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import useCartDetails from '../../hooks/useCartDetails'
import { PATHS, productPath } from '../../routes/paths'
import { MAX_ITEM_QUANTITY, MAX_ORDER_ITEMS, ROLES } from '../../utils/constants'
import { formatPaise, toPaise } from '../../utils/orders'
import { localized, msg, t } from '../../i18n'
import useLocalizedNames from '../../hooks/useLocalizedNames'
import { getFarmName } from '../../services/nameService'

const PROBLEM_TEXT = {
  unavailable: msg('No longer available — please remove it.'),
  'out-of-stock': msg('Out of stock — please remove it.'),
}

function CartLine({ line }) {
  const { setQuantity, removeItem } = useCart()
  const { product, quantity, problem } = line

  return (
    <li className="flex gap-4 p-4">
      {product ? (
        <Link to={productPath(product.id)} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
          <ProductImage product={product} size={160} />
        </Link>
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-lg bg-cream-200 sm:h-24 sm:w-24" />
      )}
      <div className="min-w-0 flex-1">
        {product ? (
          <>
            <Link to={productPath(product.id)} className="font-semibold text-gray-900 hover:text-brand-700">
              {localized(product, 'name')}
            </Link>
            <div className="mt-1">
              <PriceTag price={product.price} mrp={product.mrp} unit={product.unit} />
            </div>
          </>
        ) : (
          <p className="font-semibold text-gray-500">{t('Unavailable product')}</p>
        )}

        {problem && problem !== 'too-many' && (
          <p className="mt-2 text-sm font-medium text-red-600">{t(PROBLEM_TEXT[problem])}</p>
        )}
        {problem === 'too-many' && (
          <p className="mt-2 text-sm font-medium text-amber-700">
            {t('Only {count} left.', { count: product.stock })}{' '}
            <button
              type="button"
              onClick={() => setQuantity(product.id, product.stock)}
              className="font-semibold text-brand-700 underline"
            >
              {t('Change to {count}', { count: product.stock })}
            </button>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {product && product.stock > 0 && (
            <QuantityStepper
              value={quantity}
              max={Math.max(1, Math.min(product.stock, MAX_ITEM_QUANTITY))}
              onChange={(q) => setQuantity(line.productId, q)}
              label={t('Quantity of {product}', { product: localized(product, 'name') })}
            />
          )}
          <button
            type="button"
            onClick={() => removeItem(line.productId)}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            {t('Remove')}
          </button>
        </div>
      </div>
      {product && !problem && (
        <p className="shrink-0 text-right font-semibold text-gray-900">
          {formatPaise(toPaise(product.price) * quantity)}
        </p>
      )}
    </li>
  )
}

export default function CartPage() {
  const { role } = useAuth()
  const { items } = useCart()
  const { lines, totals, units, hasProblems, loading, error, reload } = useCartDetails()
  useLocalizedNames()

  // Group lines by farm, like separate shipments.
  const groups = []
  lines.forEach((line) => {
    const key = line.product?.farmerId ?? 'unavailable'
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, farmName: line.product?.farmName ?? t('Unavailable items'), lines: [] }
      groups.push(group)
    }
    group.lines.push(line)
  })

  const blockedRole = role === ROLES.FARMER || role === ROLES.ADMIN

  return (
    <Container className="py-6">
      <PageMeta title={t('Your cart')} noIndex />
      <h1 className="mb-4 text-2xl font-bold text-gray-900">{t('Your cart')}</h1>

      {items.length === 0 ? (
        <EmptyState
          title={t('Your cart is empty')}
          message={t('Browse fresh produce from local farms and add something you like.')}
          action={<Button to={PATHS.PRODUCTS}>{t('Start shopping')}</Button>}
        />
      ) : error ? (
        <LoadError error={error} onRetry={reload} title={t('We couldn’t load your cart')} />
      ) : loading ? (
        <Spinner fullPage />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.key} className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
                <h2 className="border-b border-gray-100 bg-cream-50 px-4 py-2 text-sm font-semibold text-gray-700">
                  {group.key === 'unavailable' ? group.farmName : t('Shipped by {farm}', { farm: getFarmName(group.key, group.farmName) })}
                </h2>
                <ul className="divide-y divide-gray-100">
                  {group.lines.map((line) => (
                    <CartLine key={line.productId} line={line} />
                  ))}
                </ul>
              </section>
            ))}
            <p className="text-xs text-gray-500">
              {t('One order can contain up to {items} different products and up to {quantity} of each. Prices and stock are checked again when you place the order.', { items: MAX_ORDER_ITEMS, quantity: MAX_ITEM_QUANTITY })}
            </p>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary totals={totals} units={units}>
              {blockedRole ? (
                <p className="text-sm text-gray-600">
                  {t('Seller and admin accounts can’t place orders. Sign in with a customer account to buy.')}
                </p>
              ) : (
                <>
                  <Button to={hasProblems ? undefined : PATHS.CHECKOUT} disabled={hasProblems} className="w-full" size="lg">
                    {t('Proceed to checkout')}
                  </Button>
                  {hasProblems && (
                    <p className="mt-2 text-xs text-red-600">{t('Fix the highlighted items to continue.')}</p>
                  )}
                  <p className="mt-3 text-center text-xs text-gray-500">{t('Pay with Cash on Delivery')}</p>
                </>
              )}
            </OrderSummary>
          </div>
        </div>
      )}
    </Container>
  )
}
