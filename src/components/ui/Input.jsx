import { useId } from 'react'

/**
 * Labelled text input with an optional hint and error message.
 * Any extra props (type, value, onChange, autoComplete…) go to the <input>.
 * `endAdornment` puts something (like a "Show" button) inside the right edge.
 */
export default function Input({ label, error, hint, endAdornment, className = '', ...rest }) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error || hint

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`block h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-xs transition-colors placeholder:text-gray-400 focus:ring-2 focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-100'
          } ${endAdornment ? 'pr-16' : ''}`}
          {...rest}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">{endAdornment}</div>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
