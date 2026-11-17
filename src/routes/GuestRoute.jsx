import { Navigate, Outlet, useLocation } from 'react-router'
import Spinner from '../components/ui/Spinner'
import useAuth from '../hooks/useAuth'
import { getDefaultPathForRole } from './paths'

/**
 * For pages only signed-out visitors need (login, signup, forgot password).
 * Once a user is signed in and their profile has loaded, they are sent on —
 * back to the page they originally wanted, or to their role's home page.
 */
export default function GuestRoute() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Only block the page while we don't yet know if anyone is signed in.
  // (We must not unmount the signup form while it is creating an account.)
  if (loading && !user) return <Spinner fullPage />

  if (user && profile) {
    const from = location.state?.from
    const target = from
      ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
      : getDefaultPathForRole(profile.role)
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
