import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PATHS } from '../routes/paths'
import { logOut } from '../services/authService'

/** Returns { signOut, signingOut }. Signs out and goes to the home page. */
export default function useSignOut() {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    // Leave any protected page first, so it doesn't bounce to the login page.
    navigate(PATHS.HOME, { replace: true })
    try {
      await logOut()
    } finally {
      setSigningOut(false)
    }
  }

  return { signOut, signingOut }
}
