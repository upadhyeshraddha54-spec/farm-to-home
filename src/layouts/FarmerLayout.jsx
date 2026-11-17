import { useMemo } from 'react'
import useAuth from '../hooks/useAuth'
import useLiveData from '../hooks/useLiveData'
import { PATHS } from '../routes/paths'
import { subscribeToFarm } from '../services/farmService'
import { subscribeToFarmerOrders } from '../services/orderService'
import { subscribeToFarmerProducts } from '../services/productService'
import { isFarmerSuspended, normalizeFarmerStatus, ORDER_STATUS } from '../utils/constants'
import DashboardLayout from './DashboardLayout'

function navItems(newOrders) {
  return [
    { label: 'Overview', to: PATHS.FARMER, end: true },
    { label: 'Orders', to: PATHS.FARMER_ORDERS, badge: newOrders },
    { label: 'My products', to: PATHS.FARMER_PRODUCTS, end: true },
    { label: 'Add product', to: PATHS.FARMER_PRODUCT_NEW },
    { label: 'Farm profile', to: PATHS.FARMER_PROFILE },
  ]
}

/**
 * Farmer dashboard shell. Loads the farm profile, products and orders ONCE (live)
 * and shares them with every dashboard page — read them with useFarmerData().
 */
export default function FarmerLayout() {
  const { user, profile } = useAuth()
  const farm = useLiveData(subscribeToFarm, user.uid)
  const products = useLiveData(subscribeToFarmerProducts, user.uid)
  const orders = useLiveData(subscribeToFarmerOrders, user.uid)

  const context = useMemo(
    () => ({
      uid: user.uid,
      canSell: !isFarmerSuspended(profile.farmerStatus),
      farmerStatus: normalizeFarmerStatus(profile.farmerStatus),
      farm: farm.data ?? null,
      farmLoading: farm.loading,
      farmError: farm.error,
      products: products.data ?? [],
      productsLoading: products.loading,
      productsError: products.error,
      orders: orders.data ?? [],
      ordersLoading: orders.loading,
      ordersError: orders.error,
    }),
    [user.uid, profile.farmerStatus, farm, products, orders],
  )

  // Orders waiting for this farmer to confirm.
  const newOrders = context.orders.filter(
    (o) => o.fulfilment?.[user.uid]?.status === ORDER_STATUS.PLACED,
  ).length

  return (
    <DashboardLayout title="Farmer Dashboard" navItems={navItems(newOrders)} outletContext={context} />
  )
}
