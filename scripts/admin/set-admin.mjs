#!/usr/bin/env node
/**
 * Farm To Home — grant or revoke the admin role (Firebase Admin SDK).
 *
 *   npm run admin:grant -- person@example.com            Preview
 *   npm run admin:grant -- person@example.com --write    Make them an admin
 *   npm run admin:grant -- person@example.com --revoke --write   Back to customer
 *
 * The person must first create a normal account on the website. Admin rights
 * can only be given here (or by hand in the Firebase console) — the security
 * rules stop anyone from making themselves an admin through the website.
 */
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { fail, initAdmin } from '../lib/admin-sdk.mjs'

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const REVOKE = args.includes('--revoke')
const email = args.find((a) => !a.startsWith('--'))
if (!email || !email.includes('@')) {
  fail('Usage: npm run admin:grant -- person@example.com [--revoke] [--write]')
}

const { projectId } = initAdmin()
const db = getFirestore()

let user
try {
  user = await getAuth().getUserByEmail(email)
} catch {
  fail(`No account with the email ${email} in project "${projectId}". Ask them to sign up on the website first.`)
}

const ref = db.doc(`users/${user.uid}`)
const snap = await ref.get()
if (!snap.exists) fail(`${email} has a login but no profile. Ask them to sign in once on the website.`)
const current = snap.get('role')

console.log(`\nProject: ${projectId}`)
console.log(`User:    ${snap.get('name')} <${email}> (current role: ${current})`)

if (REVOKE) {
  if (current !== 'admin') fail(`${email} is not an admin.`)
  const admins = await db.collection('users').where('role', '==', 'admin').get()
  if (admins.size <= 1) fail('This is the only admin. Grant admin to someone else first.')
  console.log('Change:  admin → customer')
  if (WRITE) await ref.update({ role: 'customer' })
} else {
  if (current === 'admin') {
    console.log('\nAlready an admin. Nothing to do.\n')
    process.exit(0)
  }
  if (current === 'farmer') {
    console.log('Note:    this is a farmer account; their farm stays, but they will stop being a seller.')
  }
  console.log(`Change:  ${current} → admin`)
  if (WRITE) {
    await ref.update({ role: 'admin', farmerStatus: FieldValue.delete(), blocked: FieldValue.delete() })
  }
}

console.log(WRITE ? '\nDone. They may need to sign out and back in.\n' : '\nPreview only — add --write to apply.\n')
process.exit(0)
