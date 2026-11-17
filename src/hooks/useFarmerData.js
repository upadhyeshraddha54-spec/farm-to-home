import { useOutletContext } from 'react-router'

/**
 * Data shared by <FarmerLayout> with all farmer dashboard pages:
 * { uid, canSell, farmerStatus ('active' | 'suspended'), farm, farmLoading, farmError,
 *   products, productsLoading, productsError, orders, ordersLoading, ordersError }
 */
export default function useFarmerData() {
  const context = useOutletContext()
  if (!context) {
    throw new Error('useFarmerData must be used inside <FarmerLayout>.')
  }
  return context
}
