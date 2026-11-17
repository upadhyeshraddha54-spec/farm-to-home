import { useOutletContext } from 'react-router'

/**
 * Data shared by <AdminLayout> with all admin pages:
 * { users, usersLoading, usersError, orders, ordersLoading, ordersError,
 *   messages, messagesLoading, messagesError }
 */
export default function useAdminData() {
  const context = useOutletContext()
  if (!context) throw new Error('useAdminData must be used inside <AdminLayout>.')
  return context
}
