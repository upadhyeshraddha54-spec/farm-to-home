import { defineConfig } from 'vitest/config'

// Tests run against the local Firebase emulators ONLY (see `npm run test:emulator`).
// envDir points at an empty folder so .env.local (your real project) is never loaded.
export default defineConfig({
  envDir: 'tests/env',
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    env: {
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-farm-to-home.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-farm-to-home',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-farm-to-home.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
      VITE_FIREBASE_APP_ID: '1:1:web:1',
      VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085',
      VITE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    },
  },
})
