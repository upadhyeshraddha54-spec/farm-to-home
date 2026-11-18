import { Suspense } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/common/Logo'
import useSignOut from '../hooks/useSignOut'
import { PATHS } from '../routes/paths'
import LanguageSwitcher from '../components/common/LanguageSwitcher'
import { t } from '../i18n'

/**
 * Shared layout for the Farmer and Admin dashboards.
 *
 * Props:
 *  - title: shown at the top of the sidebar, e.g. "Farmer Dashboard"
 *  - navItems: [{ label, to, end? }] — the sidebar links for that role
 *  - outletContext: data passed to every page inside (read with useOutletContext)
 *
 * Desktop: fixed sidebar on the left.
 * Mobile: the same links become a horizontally scrollable tab bar.
 */
export default function DashboardLayout({ title, navItems = [], outletContext }) {
  const { signOut, signingOut } = useSignOut()

  const linkClass = ({ isActive }) =>
    `block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-gray-700 hover:bg-brand-50 hover:text-brand-700'
    }`

  return (
    <div className="flex min-h-dvh flex-col bg-cream-100 lg:flex-row">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-4 py-2 font-semibold text-brand-800 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('Skip to content')}
      </a>
      <aside className="border-b border-cream-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <Logo />
          {/* Mobile-only quick actions (desktop has them at the bottom of the sidebar) */}
          <div className="flex items-center gap-1 lg:hidden">
            <LanguageSwitcher />
            <Link
              to={PATHS.HOME}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              {t('Store')}
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              {t('Sign out')}
            </button>
          </div>
        </div>
        <p className="px-4 pb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
          {title}
        </p>
        <nav aria-label={title} className="relative overflow-x-auto px-2 pb-3 lg:flex-1 lg:overflow-visible">
          <ul className="flex gap-1 lg:flex-col">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass}>
                  <span className="flex items-center justify-between gap-2">
                    {item.label}
                    {item.badge > 0 && (
                      <span className="rounded-full bg-accent-500 px-2 text-xs font-bold text-gray-900">
                        {item.badge}
                        <span className="sr-only"> {t('new')}</span>
                      </span>
                    )}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden space-y-1 border-t border-cream-200 p-2 lg:block">
          <LanguageSwitcher className="px-1 pb-1" />
          <Link
            to={PATHS.HOME}
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700"
          >
            {t('← Back to store')}
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            {signingOut ? t('Signing out…') : t('Sign out')}
          </button>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
        <Suspense fallback={<Spinner fullPage />}>
          <Outlet context={outletContext} />
        </Suspense>
      </main>
      <ScrollRestoration />
    </div>
  )
}
