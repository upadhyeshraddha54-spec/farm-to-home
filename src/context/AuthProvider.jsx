import { useEffect, useMemo, useState } from 'react'
import { subscribeToAuthChanges, subscribeToUserProfile } from '../services/authService'
import { AuthContext } from './authContext'

/**
 * Keeps track of who is signed in and loads their Firestore profile
 * (name, role, farmer status). Wrap the whole app in this once.
 */
export default function AuthProvider({ children }) {
  // undefined = Firebase hasn't told us yet, null = signed out
  const [user, setUser] = useState(undefined)
  const [profileState, setProfileState] = useState({
    uid: null,
    profile: null,
    error: null,
  })

  useEffect(() => subscribeToAuthChanges(setUser), [])

  useEffect(() => {
    if (!user) return undefined
    return subscribeToUserProfile(
      user.uid,
      (profile) => setProfileState({ uid: user.uid, profile, error: null }),
      (error) => setProfileState({ uid: user.uid, profile: null, error }),
    )
  }, [user])

  const value = useMemo(() => {
    // Ignore profile data left over from a previous user.
    const isCurrent = Boolean(user) && profileState.uid === user.uid
    const profile = isCurrent ? profileState.profile : null

    return {
      user: user ?? null,
      profile,
      role: profile?.role ?? null,
      profileError: isCurrent ? profileState.error : null,
      // Still loading until we know the user AND (if signed in) their profile.
      loading: user === undefined || (Boolean(user) && !isCurrent),
    }
  }, [user, profileState])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
