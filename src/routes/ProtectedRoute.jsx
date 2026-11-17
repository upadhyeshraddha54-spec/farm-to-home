import { Navigate, Outlet, useLocation } from 'react-router'
import AccountProblem from '../components/common/AccountProblem'
import Spinner from '../components/ui/Spinner'
import useAuth from '../hooks/useAuth'
import { getDefaultPathForRole, PATHS } from './paths'

/**
 * Guards a group of routes.
 * - Not signed in → sent to the login page (and brought back after login).
 * - Signed in with the wrong role → sent to their own home page.
 *
 * Usage in the router:
 *   { element: <ProtectedRoute allowedRoles={[ROLES.FARMER]} />, children: [...] }
 * Leave out `allowedRoles` to allow any signed-in user.
 *
 * This only controls what the UI shows. The real protection for data is
 * in firestore.rules, which Firebase enforces on its servers.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, profileError, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner fullPage />

  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />
  }

  if (!profile) return <AccountProblem error={profileError} />

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getDefaultPathForRole(profile.role)} replace />
  }

  return <Outlet />
}
