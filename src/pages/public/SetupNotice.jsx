import { t, tx } from '../../i18n'
/**
 * Shown instead of the app when Firebase keys are missing from .env.local.
 * This is a developer-only screen; real visitors never see it once the
 * project is configured.
 */
export default function SetupNotice({ missing }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-100 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-cream-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-gray-900">{t('Firebase is not configured yet')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {tx('Create a file named <a>.env.local</a> in the project folder (copy <b>.env.example</b>), fill in these values, then restart <c>npm run dev</c>:', {
            a: (text) => <code className="rounded bg-cream-100 px-1">{text}</code>,
            b: (text) => <code className="rounded bg-cream-100 px-1">{text}</code>,
            c: (text) => <code>{text}</code>,
          })}
        </p>
        <ul className="mt-4 space-y-1 rounded-lg bg-cream-100 p-4 font-mono text-xs text-gray-800">
          {missing.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
