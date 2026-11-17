import { useContext } from 'react'
import { CartContext } from '../context/cartContext'

/** { items, count, addItem, setQuantity, removeItem, removeItems, getQuantity } */
export default function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>.')
  return context
}
