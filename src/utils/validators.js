import { PASSWORD_MIN_LENGTH } from './constants'

// Each validator returns an error message, or '' when the value is valid.

export function validateName(value) {
  const name = value.trim()
  if (!name) return 'Please enter your name.'
  if (name.length < 2) return 'Name must be at least 2 characters.'
  if (name.length > 60) return 'Name must be 60 characters or fewer.'
  return ''
}

export function validateEmail(value) {
  const email = value.trim()
  if (!email) return 'Please enter your email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
  return ''
}

/** Optional 10-digit Indian mobile number (may start with +91). */
export function validatePhone(value) {
  const phone = value.trim()
  if (!phone) return ''
  if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(phone)) return 'Enter a valid 10-digit mobile number.'
  return ''
}

export function validatePassword(value) {
  if (!value) return 'Please enter a password.'
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must include at least one letter and one number.'
  }
  return ''
}

/** True when every value in an errors object is an empty string. */
export function hasNoErrors(errors) {
  return Object.values(errors).every((message) => !message)
}

/** Delivery address errors ('' when valid). Mirrors isValidAddress in firestore.rules. */
export function validateAddress(a) {
  const pincode = a.pincode.trim()
  return {
    fullName: validateName(a.fullName),
    phone: /^(\+91[\s-]?)?[6-9]\d{9}$/.test(a.phone.trim())
      ? ''
      : 'Enter a valid 10-digit mobile number for delivery.',
    line1:
      a.line1.trim().length < 3
        ? 'Enter your house / flat number and street.'
        : a.line1.trim().length > 120
          ? 'Keep this under 120 characters.'
          : '',
    line2: a.line2.trim().length > 120 ? 'Keep this under 120 characters.' : '',
    landmark: a.landmark.trim().length > 80 ? 'Keep this under 80 characters.' : '',
    city: a.city.trim().length < 2 || a.city.trim().length > 60 ? 'Enter your town or city.' : '',
    state: a.state ? '' : 'Choose your state.',
    pincode: /^[1-9]\d{5}$/.test(pincode) ? '' : 'Enter a valid 6-digit PIN code.',
  }
}
