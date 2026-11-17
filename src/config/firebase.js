import { getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore'

// Values come from `.env.local` (see `.env.example`).
// Firebase web config is public by design — security comes from
// Firestore Security Rules (see `firestore.rules`), not from hiding these.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const ENV_NAMES = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

/** Names of any env variables that are still empty. */
export const missingFirebaseEnv = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => ENV_NAMES[key])

export const isFirebaseConfigured = missingFirebaseEnv.length === 0

// Only connect when configured, so a missing key shows a helpful
// setup screen (see App.jsx) instead of crashing the whole app.
const app = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null

// Optional, development/testing only: use local emulators instead of the real
// project, e.g. VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
//               VITE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run dev
// (Ignored in production builds.)
const firestoreEmulator = import.meta.env.DEV ? import.meta.env.VITE_FIRESTORE_EMULATOR_HOST : ''
const authEmulator = import.meta.env.DEV ? import.meta.env.VITE_AUTH_EMULATOR_HOST : ''

// Connection mode. Firestore's default streaming connection stalled for ~55 s
// on the first write after a transaction when talking to the local emulator
// (plain HTTP); long-polling does not. Long-polling is always used with the
// emulator, and can be switched on for production with
// VITE_FIRESTORE_FORCE_LONG_POLLING=true if writes ever hang (some networks
// and proxies buffer streaming responses).
const forceLongPolling =
  Boolean(firestoreEmulator) || import.meta.env.VITE_FIRESTORE_FORCE_LONG_POLLING === 'true'

export const auth = app ? getAuth(app) : null
export const db = app
  ? initializeFirestore(app, forceLongPolling ? { experimentalForceLongPolling: true } : {})
  : null

if (db && firestoreEmulator) {
  const [host, port] = firestoreEmulator.split(':')
  connectFirestoreEmulator(db, host, Number(port))
  console.info(`[firebase] Using Firestore emulator at ${firestoreEmulator}`)
}
if (auth && authEmulator) {
  connectAuthEmulator(auth, `http://${authEmulator}`, { disableWarnings: true })
  console.info(`[firebase] Using Auth emulator at ${authEmulator}`)
}
