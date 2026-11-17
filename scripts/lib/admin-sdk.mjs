// Shared helpers for the Firebase Admin scripts (seed data, admin accounts).
// These run ONLY on your computer with your private service-account key —
// never in the website. The Admin SDK bypasses security rules.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, initializeApp } from 'firebase-admin/app'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function fail(message) {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

/** Minimal .env parser (KEY=value, optional quotes, # comments). */
export function readEnvFile(path = join(ROOT, '.env.local')) {
  if (!existsSync(path)) fail(`Could not find ${path}. Create it from .env.example first.`)
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2').trim()
  }
  return env
}

function loadServiceAccount(expectedProjectId) {
  const keyPath = resolve(process.env.FIREBASE_ADMIN_KEY ?? join(ROOT, 'firebase-admin-key.json'))
  if (!existsSync(keyPath)) {
    fail(
      `Service-account key not found at ${keyPath}.\n` +
        '  Download it from Firebase console → Project settings → Service accounts →\n' +
        '  "Generate new private key", save it as firebase-admin-key.json in the\n' +
        '  project folder (it is git-ignored), or set FIREBASE_ADMIN_KEY=/path/to/key.json',
    )
  }
  const key = JSON.parse(readFileSync(keyPath, 'utf8'))
  if (key.project_id !== expectedProjectId) {
    fail(
      `The key is for project "${key.project_id}" but .env.local points to ` +
        `"${expectedProjectId}". Refusing to continue.`,
    )
  }
  return key
}

/** Initialises the Admin SDK for the project in .env.local. Returns { env, projectId }. */
export function initAdmin() {
  const env = readEnvFile()
  const projectId = env.VITE_FIREBASE_PROJECT_ID
  if (!projectId) fail('VITE_FIREBASE_PROJECT_ID is missing from .env.local')
  initializeApp({ credential: cert(loadServiceAccount(projectId)), projectId })
  return { env, projectId }
}
