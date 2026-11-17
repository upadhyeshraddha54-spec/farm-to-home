import { updateProfile } from 'firebase/auth'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

/** Keeps just the last 10 digits of an Indian mobile number. */
export function normalizePhone(phone = '') {
  return phone.replace(/\D/g, '').slice(-10)
}

/** Trims and normalises a delivery address before saving. */
export function cleanAddress(address) {
  return {
    fullName: address.fullName.trim(),
    phone: normalizePhone(address.phone),
    line1: address.line1.trim(),
    line2: (address.line2 ?? '').trim(),
    landmark: (address.landmark ?? '').trim(),
    city: address.city.trim(),
    state: address.state,
    pincode: address.pincode.trim(),
  }
}

/** Updates the signed-in user's name and phone (role/status can't be changed). */
export async function updateMyDetails(uid, { name, phone }) {
  await updateDoc(doc(db, 'users', uid), {
    name: name.trim(),
    phone: phone ? normalizePhone(phone) : '',
  })
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name.trim() })
}

/** Saves the default delivery address on the user's profile. */
export function saveMyAddress(uid, address) {
  return updateDoc(doc(db, 'users', uid), { address: cleanAddress(address) })
}

/** Contact form: stores a message for the admins to read. */
export function sendContactMessage({ name, subject, message, orderId }) {
  const user = auth.currentUser
  if (!user) throw new Error('Please sign in to send a message.')
  return addDoc(collection(db, 'messages'), {
    uid: user.uid,
    email: user.email,
    name: name.trim(),
    subject: subject.trim(),
    message: message.trim(),
    orderId: (orderId ?? '').trim(),
    status: 'new',
    createdAt: serverTimestamp(),
  })
}
