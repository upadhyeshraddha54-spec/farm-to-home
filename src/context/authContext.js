import { createContext } from 'react'

// Holds: { user, profile, role, loading, profileError }
// Provided by <AuthProvider>, read with the useAuth() hook.
export const AuthContext = createContext(null)
