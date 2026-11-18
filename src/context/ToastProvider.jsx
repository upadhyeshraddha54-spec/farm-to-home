import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toastContext'
import { t } from '../i18n'

const DURATION_MS = 4500
const STYLES = {
  success: 'border-brand-200 bg-white text-brand-800',
  error: 'border-red-200 bg-white text-red-700',
  info: 'border-gray-200 bg-white text-gray-800',
}
const ICONS = { success: '✓', error: '!', info: 'i' }
const ICON_STYLES = {
  success: 'bg-brand-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-700 text-white',
}

/** Small pop-up notifications ("Added to cart", "Order confirmed", …). */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (type, message) => {
      const id = ++nextId.current
      setToasts((list) => [...list.slice(-3), { id, type, message }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${STYLES[toast.type]}`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ICON_STYLES[toast.type]}`}
            >
              {ICONS[toast.type]}
            </span>
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="-mr-1 rounded px-1 text-gray-400 hover:text-gray-700"
              aria-label={t('Dismiss notification')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
