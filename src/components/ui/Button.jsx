import { Link } from 'react-router'

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  accent: 'bg-accent-500 text-gray-900 hover:bg-accent-400 active:bg-accent-600',
  outline: 'border border-brand-600 text-brand-700 bg-white hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  'danger-ghost': 'text-red-600 hover:bg-red-50',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

/**
 * Reusable button.
 * - Pass `to` to render a router link styled as a button.
 * - Pass `href` to render a normal anchor (e.g. in-page "#section" links).
 * - Otherwise renders a <button>.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  className = '',
  type = 'button',
  children,
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
    'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
