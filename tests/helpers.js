import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, updateDoc } from 'firebase/firestore'

export const PROJECT_ID = 'demo-farm-to-home'

/** Refuse to run anywhere except the local emulators. */
export function assertEmulatorOnly() {
  if (
    import.meta.env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID ||
    !import.meta.env.VITE_FIRESTORE_EMULATOR_HOST ||
    !import.meta.env.VITE_AUTH_EMULATOR_HOST ||
    !import.meta.env.DEV
  ) {
    throw new Error('Tests must run against the Firebase emulators (npm run test:emulator).')
  }
}

let testEnv
/** Helper with security rules disabled — only for arranging test data. */
export async function getTestEnv() {
  testEnv ??= await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
  })
  return testEnv
}

export async function resetEmulators() {
  await fetch(
    `http://127.0.0.1:8085/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  })
}

/** Arrange data directly (bypassing rules), e.g. to create the first admin. */
export async function asSuperuser(fn) {
  const env = await getTestEnv()
  await env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()))
}

export async function makeAdmin(uid) {
  await asSuperuser((db) => updateDoc(doc(db, 'users', uid), { role: 'admin' }))
}

/** Expect a promise to be rejected by the security rules. */
export async function expectDenied(promise) {
  try {
    await promise
  } catch (error) {
    if (error?.code === 'permission-denied' || /PERMISSION_DENIED|permission/i.test(error?.message)) {
      return
    }
    throw new Error(`Expected permission-denied, got: ${error?.code ?? ''} ${error?.message}`)
  }
  throw new Error('Expected the write to be denied, but it succeeded.')
}
