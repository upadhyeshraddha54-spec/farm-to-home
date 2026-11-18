import { msg, t } from '../i18n'

// Firebase errors arrive as codes like "auth/wrong-password".
// This turns them into messages a shopper can understand.
const MESSAGES = {
  'auth/email-already-in-use': msg('An account with this email already exists. Try signing in instead.'),
  'auth/invalid-email': msg('Please enter a valid email address.'),
  'auth/invalid-credential': msg('Incorrect email or password.'),
  'auth/wrong-password': msg('Incorrect email or password.'),
  'auth/user-not-found': msg('Incorrect email or password.'),
  'auth/user-disabled': msg('This account has been disabled. Please contact support.'),
  'auth/weak-password': msg('Please choose a stronger password.'),
  'auth/too-many-requests': msg('Too many attempts. Please wait a few minutes and try again.'),
  'auth/network-request-failed': msg('Network error. Check your internet connection and try again.'),
  'auth/operation-not-allowed': msg('Email/password sign-in is not enabled for this Firebase project yet.'),
  'permission-denied': msg('You do not have permission to do that.'),
  'failed-precondition': msg('The database needs a one-time setup step (a missing index). Please try again in a few minutes.'),
  unavailable: msg('The service is temporarily unavailable. Please try again.'),
}

export function getFriendlyErrorMessage(error) {
  return t(MESSAGES[error?.code] ?? msg('Something went wrong. Please try again.'))
}
