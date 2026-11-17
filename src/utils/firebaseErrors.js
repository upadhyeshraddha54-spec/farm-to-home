// Firebase errors arrive as codes like "auth/wrong-password".
// This turns them into messages a shopper can understand.
const MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/weak-password': 'Please choose a stronger password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/operation-not-allowed':
    'Email/password sign-in is not enabled for this Firebase project yet.',
  'permission-denied': 'You do not have permission to do that.',
  'failed-precondition': 'The database needs a one-time setup step (a missing index). Please try again in a few minutes.',
  unavailable: 'The service is temporarily unavailable. Please try again.',
}

export function getFriendlyErrorMessage(error) {
  return MESSAGES[error?.code] ?? 'Something went wrong. Please try again.'
}
