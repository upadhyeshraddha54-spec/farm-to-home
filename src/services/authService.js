import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { FARMER_STATUS, ROLES } from '../utils/constants'

const SIGNUP_ROLES = [ROLES.CUSTOMER, ROLES.FARMER]

/** Keeps just the last 10 digits of an Indian mobile number. */
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-10)
}

/**
 * Creates a Firebase Auth account AND the matching profile document
 * at users/{uid}. If saving the profile fails, the new account is deleted
 * so we never end up with a login that has no role.
 */
export async function signUp({ name, email, password, phone = '', role }) {
  if (!SIGNUP_ROLES.includes(role)) {
    throw new Error('Invalid role selected.')
  }

  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)

  try {
    await updateProfile(user, { displayName: name.trim() })

    const profile = {
      name: name.trim(),
      email: user.email,
      phone: phone ? normalizePhone(phone) : '',
      role,
      createdAt: serverTimestamp(),
    }
    // Farmers can sell straight away; admins can suspend them later.
    if (role === ROLES.FARMER) {
      profile.farmerStatus = FARMER_STATUS.ACTIVE
    }

    await setDoc(doc(db, 'users', user.uid), profile)
  } catch (error) {
    await deleteUser(user).catch(() => {})
    throw error
  }

  return user
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password)
}

export function logOut() {
  return signOut(auth)
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim())
}

/** Calls `callback(user | null)` whenever someone signs in or out. */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Listens to a user's profile document live, so changes (for example an
 * admin suspending or reinstating a farmer) show up immediately.
 */
export function subscribeToUserProfile(uid, onData, onError) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError,
  )
}
