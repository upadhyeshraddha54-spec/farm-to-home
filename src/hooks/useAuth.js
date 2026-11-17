import { useContext } from 'react'
import { AuthContext } from '../context/authContext'

/** Returns { user, profile, role, loading, profileError }. */
export default function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.')
  }
  return context
}
