const STYLES = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-brand-200 bg-brand-50 text-brand-800',
  warning: 'border-accent-400/50 bg-accent-400/10 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

/** Coloured message box. Errors are announced to screen readers. */
export default function Alert({ variant = 'info', title, children, className = '' }) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${STYLES[variant]} ${className}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  )
}
