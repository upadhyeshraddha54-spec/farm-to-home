import { useMemo } from 'react'
import useLiveData from '../hooks/useLiveData'
import { PATHS } from '../routes/paths'
import { subscribeToMessages, subscribeToUsers } from '../services/adminService'
import { subscribeToRecentOrders } from '../services/orderService'
import { isFarmerSuspended, ROLES } from '../utils/constants'
import DashboardLayout from './DashboardLayout'

const ADMIN_ORDER_WINDOW = 500 // most recent orders loaded for the dashboard

const subscribeUsers = (_key, onData, onError) => subscribeToUsers(onData, onError)
const subscribeMessages = (_key, onData, onError) => subscribeToMessages(onData, onError)
const subscribeOrders = (_key, onData, onError) =>
  subscribeToRecentOrders(ADMIN_ORDER_WINDOW, onData, onError)

/**
 * Admin dashboard shell. Loads users, recent orders and contact messages ONCE
 * (live) and shares them with every admin page — read them with useAdminData().
 */
export default function AdminLayout() {
  const users = useLiveData(subscribeUsers, 'all')
  const orders = useLiveData(subscribeOrders, 'recent')
  const messages = useLiveData(subscribeMessages, 'all')

  const context = useMemo(
    () => ({
      users: users.data ?? [],
      usersLoading: users.loading,
      usersError: users.error,
      orders: orders.data ?? [],
      ordersLoading: orders.loading,
      ordersError: orders.error,
      messages: messages.data ?? [],
      messagesLoading: messages.loading,
      messagesError: messages.error,
    }),
    [users, orders, messages],
  )

  const suspendedFarmers = context.users.filter(
    (u) => u.role === ROLES.FARMER && isFarmerSuspended(u.farmerStatus),
  ).length
  const newMessages = context.messages.filter((m) => m.status === 'new').length

  const navItems = [
    { label: 'Overview', to: PATHS.ADMIN, end: true },
    { label: 'Farmers', to: PATHS.ADMIN_FARMERS, badge: suspendedFarmers },
    { label: 'Orders', to: PATHS.ADMIN_ORDERS },
    { label: 'Products', to: PATHS.ADMIN_PRODUCTS },
    { label: 'Users', to: PATHS.ADMIN_USERS },
    { label: 'Categories', to: PATHS.ADMIN_CATEGORIES },
    { label: 'Messages', to: PATHS.ADMIN_MESSAGES, badge: newMessages },
  ]

  return <DashboardLayout title="Admin" navItems={navItems} outletContext={context} />
}
