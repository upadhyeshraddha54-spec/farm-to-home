import { useId } from 'react'

/**
 * Labelled dropdown. `options` is [{ value, label }].
 * Pass `placeholder` to show an empty first choice like "Select a category".
 */
export default function Select({ label, error, options, placeholder, className = '', ...rest }) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`block h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-xs focus:ring-2 focus:outline-none ${
          error
            ? 'border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-brand-500 focus:ring-brand-100'
        }`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
