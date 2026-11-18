import { useId } from 'react'
import useLanguage from '../../hooks/useLanguage'
import { LANGUAGES, t } from '../../i18n'

/**
 * Language picker (English / हिंदी / मराठी). The choice is saved in this
 * browser and applies to the whole site.
 * `tone="dark"` for green backgrounds (header), `"light"` for white ones.
 */
export default function LanguageSwitcher({ tone = 'light', className = '' }) {
  const { language, setLanguage } = useLanguage()
  const id = useId()
  const styles =
    tone === 'dark'
      ? 'border-brand-500 bg-brand-800 text-white focus:ring-accent-400'
      : 'border-gray-300 bg-white text-gray-800 focus:ring-brand-200'

  return (
    <div className={`relative flex items-center ${className}`}>
      <label htmlFor={id} className="sr-only">
        {t('Language')}
      </label>
      <svg
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute left-2 h-4 w-4 ${tone === 'dark' ? 'text-brand-100' : 'text-gray-500'}`}
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm5.9 7h-2.5a12.7 12.7 0 0 0-1.1-4.4A6 6 0 0 1 15.9 9ZM10 4.1c.7.9 1.3 2.6 1.4 4.9H8.6c.1-2.3.7-4 1.4-4.9ZM7.7 4.6A12.7 12.7 0 0 0 6.6 9H4.1a6 6 0 0 1 3.6-4.4ZM4.1 11h2.5c.1 1.7.5 3.2 1.1 4.4A6 6 0 0 1 4.1 11Zm5.9 4.9c-.7-.9-1.3-2.6-1.4-4.9h2.8c-.1 2.3-.7 4-1.4 4.9Zm2.3-.5c.6-1.2 1-2.7 1.1-4.4h2.5a6 6 0 0 1-3.6 4.4Z"
        />
      </svg>
      <select
        id={id}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={`h-9 appearance-none rounded-md border py-0 pr-2 pl-7 text-sm font-medium focus:ring-2 focus:outline-none ${styles}`}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} lang={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}
