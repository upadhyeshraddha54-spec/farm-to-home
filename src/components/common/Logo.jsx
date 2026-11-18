import { Link } from 'react-router'
import { PATHS } from '../../routes/paths'
import { APP_NAME } from '../../utils/constants'
import { t } from '../../i18n'

/** Brand mark + name. `light` is for dark (green) backgrounds. */
export default function Logo({ light = false }) {
  return (
    <Link
      to={PATHS.HOME}
      className="flex shrink-0 items-center gap-2"
      aria-label={t('{app} home', { app: APP_NAME })}
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#faf6ec' : '#1f7a3f'} />
        <path
          d="M9 23c0-8 5-13 14-14-1 9-6 14-14 14z"
          fill={light ? '#1f7a3f' : '#faf6ec'}
        />
        <path
          d="M9 23l8-8"
          stroke={light ? '#faf6ec' : '#1f7a3f'}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`text-lg font-extrabold tracking-tight ${
          light ? 'text-white' : 'text-brand-800'
        }`}
      >
        Farm<span className={light ? 'text-accent-400' : 'text-accent-600'}>To</span>Home
      </span>
    </Link>
  )
}
