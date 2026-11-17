import { useState } from 'react'
import { Link } from 'react-router'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import useToast from '../../hooks/useToast'
import { PATHS } from '../../routes/paths'
import { MAX_ITEM_QUANTITY, ROLES } from '../../utils/constants'
import Button from '../ui/Button'
import QuantityStepper from '../ui/QuantityStepper'

/** Quantity + "Add to cart" for a product page. */
export default function AddToCart({ product }) {
  const { role } = useAuth()
  const { addItem, getQuantity } = useCart()
  const toast = useToast()
  const inCart = getQuantity(product.id)
  const maxForThisProduct = Math.min(product.stock, MAX_ITEM_QUANTITY)
  const canAddMore = Math.max(0, maxForThisProduct - inCart)
  const [quantity, setQuantity] = useState(1)

  if (role === ROLES.FARMER || role === ROLES.ADMIN) {
    return (
      <p className="rounded-lg bg-cream-100 px-3 py-2 text-sm text-gray-600">
        Seller and admin accounts can’t place orders. Sign in with a customer account to buy.
      </p>
    )
  }

  if (!product.isActive || product.stock <= 0) return null

  function handleAdd() {
    const result = addItem(product.id, Math.min(quantity, canAddMore), maxForThisProduct)
    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    toast.success(`Added to cart — ${product.name} × ${result.quantity}`)
    setQuantity(1)
  }

  return (
    <div className="space-y-3">
      {canAddMore > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper
            value={Math.min(quantity, canAddMore)}
            max={canAddMore}
            onChange={setQuantity}
          />
          <Button variant="accent" size="lg" onClick={handleAdd} className="flex-1 sm:flex-none">
            Add to cart
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          You have the maximum available quantity of this item in your cart.
        </p>
      )}
      {inCart > 0 && (
        <p className="text-sm text-gray-700">
          {inCart} in your cart ·{' '}
          <Link to={PATHS.CART} className="font-semibold text-brand-700 hover:underline">
            Go to cart
          </Link>
        </p>
      )}
    </div>
  )
}
