import { useId, useState } from 'react'
import { msg, t, tp } from '../../i18n'

function Star({ fill, className }) {
  // fill: 0–1 (how much of the star is filled)
  const id = useId()
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="currentColor" />
          <stop offset={`${fill * 100}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z"
        fill={`url(#${id})`}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' }

/**
 * Read-only stars. `value` 0–5 (decimals allowed), optional review `count`.
 * Renders nothing when there are no reviews unless `showEmpty`.
 */
export default function RatingStars({ value = 0, count, size = 'md', showEmpty = false, className = '' }) {
  if (!count && !showEmpty) return null
  const label = count
    ? tp(count, '{rating} out of 5 stars from {count} review', '{rating} out of 5 stars from {count} reviews', { rating: value })
    : t('No reviews yet')
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} role="img" aria-label={label}>
      <span className="flex text-accent-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} fill={Math.max(0, Math.min(1, value - (star - 1)))} className={SIZES[size]} />
        ))}
      </span>
      {count ? (
        <span className={`text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          <span className="font-semibold text-gray-800">{value}</span> ({count})
        </span>
      ) : (
        <span className="text-xs text-gray-500">{t('No reviews yet')}</span>
      )}
    </span>
  )
}

const WORDS = { 1: msg('Poor'), 2: msg('Fair'), 3: msg('Good'), 4: msg('Very good'), 5: msg('Excellent') }

/** Star picker for the review form (radio buttons, keyboard accessible). */
export function RatingInput({ value, onChange, name = 'rating', error }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-gray-800">{t('Your rating')}</legend>
      <div className="flex items-center gap-2">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <label key={star} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(star)}>
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="sr-only"
                aria-label={`${tp(star, '{count} star', '{count} stars')} — ${t(WORDS[star])}`}
              />
              <Star
                fill={star <= shown ? 1 : 0}
                className={`h-8 w-8 ${star <= shown ? 'text-accent-500' : 'text-gray-300'} [input:focus-visible+&]:rounded [input:focus-visible+&]:ring-2 [input:focus-visible+&]:ring-brand-400`}
              />
            </label>
          ))}
        </div>
        <span className="text-sm text-gray-600">{shown ? t(WORDS[shown]) : t('Tap a star')}</span>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </fieldset>
  )
}
