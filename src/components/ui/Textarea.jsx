import { useId } from 'react'

/** Labelled multi-line text box with an optional character counter. */
export default function Textarea({ label, error, hint, maxLength, value = '', className = '', ...rest }) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error || hint

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-800">
          {label}
        </label>
        {maxLength && (
          <span className="text-xs text-gray-400">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={id}
        rows={4}
        value={value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:ring-2 focus:outline-none ${
          error
            ? 'border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-brand-500 focus:ring-brand-100'
        }`}
        {...rest}
      />
      {message && (
        <p id={messageId} className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
