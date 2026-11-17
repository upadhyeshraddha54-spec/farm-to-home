import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import AddressFields from '../../components/order/AddressFields'
import OrderSummary from '../../components/order/OrderSummary'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import useCartDetails from '../../hooks/useCartDetails'
import useToast from '../../hooks/useToast'
import { orderPath, PATHS } from '../../routes/paths'
import { CheckoutError, newOrderId, placeOrder } from '../../services/orderService'
import { cleanAddress, saveMyAddress } from '../../services/profileService'
import { getUnitLabel } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { EMPTY_ADDRESS, formatPaise, toPaise } from '../../utils/orders'
import { hasNoErrors, validateAddress } from '../../utils/validators'

function initialAddress(profile) {
  if (profile?.address) return { ...EMPTY_ADDRESS, ...profile.address }
  return { ...EMPTY_ADDRESS, fullName: profile?.name ?? '', phone: profile?.phone ?? '' }
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile } = useAuth()
  const { removeItems } = useCart()
  const { lines, totals, units, hasProblems, loading, error, reload } = useCartDetails()

  // One order ID per checkout visit: pressing "Place order" twice (or a
  // network retry) can never create two orders.
  const [orderId] = useState(newOrderId)
  const [address, setAddress] = useState(() => initialAddress(profile))
  const [errors, setErrors] = useState({})
  const [saveAddress, setSaveAddress] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState(null) // { message, problems? }

  function handleAddressChange(name, value) {
    setAddress((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFailure(null)
    const nextErrors = validateAddress(address)
    setErrors(nextErrors)
    if (!hasNoErrors(nextErrors)) {
      setFailure({ message: 'Please check your delivery address.' })
      return
    }

    setSubmitting(true)
    const cartItems = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))
    try {
      const cleaned = cleanAddress(address)
      const result = await placeOrder({ orderId, address: cleaned, cartItems })
      if (saveAddress) {
        // Not critical: the order is already placed if this fails.
        saveMyAddress(user.uid, cleaned).catch(() => {})
      }
      removeItems(cartItems.map((i) => i.productId))
      toast.success(result.alreadyPlaced ? 'This order was already placed.' : 'Order placed! Pay in cash when it arrives.')
      navigate(orderPath(result.orderId), { replace: true })
    } catch (err) {
      setSubmitting(false)
      if (err instanceof CheckoutError) {
        setFailure({ message: err.message, problems: err.problems })
        reload()
      } else if (err?.code === 'permission-denied' && profile?.blocked) {
        setFailure({ message: 'Your account can’t place orders right now. Please contact support.' })
      } else {
        setFailure({ message: getFriendlyErrorMessage(err) })
      }
    }
  }

  if (!lines.length) {
    return (
      <Container className="py-10">
        <PageMeta title="Checkout" noIndex />
        <EmptyState
          title="Your cart is empty"
          message="Add some products before checking out."
          action={<Button to={PATHS.PRODUCTS}>Start shopping</Button>}
        />
      </Container>
    )
  }

  return (
    <Container className="py-6">
      <PageMeta title="Checkout" noIndex />
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Checkout</h1>

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : loading ? (
        <Spinner fullPage />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            {failure && (
              <Alert variant="error" title={failure.message}>
                {failure.problems?.length > 0 && (
                  <>
                    <ul className="mt-1 list-disc pl-5">
                      {failure.problems.map((p) => (
                        <li key={p.productId}>
                          {p.type === 'stock'
                            ? `${p.name}: only ${p.available} left`
                            : 'An item is no longer available'}
                        </li>
                      ))}
                    </ul>
                    <Link to={PATHS.CART} className="mt-2 inline-block font-semibold underline">
                      Review your cart
                    </Link>
                  </>
                )}
              </Alert>
            )}
            {hasProblems && !failure && (
              <Alert variant="warning">
                Some items in your cart need attention.{' '}
                <Link to={PATHS.CART} className="font-semibold underline">Go back to your cart</Link>
              </Alert>
            )}

            <section className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900">1. Delivery address</h2>
              <AddressFields values={address} errors={errors} onChange={handleAddressChange} />
              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Save this address for next time
              </label>
            </section>

            <section className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-2 text-base font-semibold text-gray-900">2. Payment</h2>
              <div className="flex items-start gap-3 rounded-lg border-2 border-brand-600 bg-brand-50 p-3">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-4 border-brand-600 bg-white" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                  <p className="text-xs text-gray-600">
                    Pay in cash to each farm’s delivery person when your items arrive.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-3 text-base font-semibold text-gray-900">3. Review items</h2>
              <ul className="divide-y divide-gray-100 text-sm">
                {lines.map((line) => (
                  <li key={line.productId} className="flex justify-between gap-3 py-2">
                    <span className={line.problem ? 'text-red-600' : 'text-gray-800'}>
                      {line.product?.name ?? 'Unavailable item'} × {line.quantity}
                      {line.product && (
                        <span className="text-gray-500"> ({getUnitLabel(line.product.unit)})</span>
                      )}
                      <span className="block text-xs text-gray-500">{line.product?.farmName}</span>
                    </span>
                    {line.product && !line.problem && (
                      <span className="font-medium">
                        {formatPaise(toPaise(line.product.price) * line.quantity)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary totals={totals} units={units} showFreeDeliveryHint={false}>
              <Button type="submit" size="lg" className="w-full" disabled={submitting || hasProblems}>
                {submitting ? 'Placing order…' : `Place order · ${formatPaise(totals.totalPaise)}`}
              </Button>
              <p className="mt-3 text-xs text-gray-500">
                By placing the order you agree to our{' '}
                <Link to={PATHS.TERMS} className="underline">Terms</Link> and{' '}
                <Link to={PATHS.CANCELLATION} className="underline">Cancellation policy</Link>.
              </p>
            </OrderSummary>
          </div>
        </form>
      )}
    </Container>
  )
}
