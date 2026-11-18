import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import Spinner from '../components/ui/Spinner'
import Footer from '../components/common/Footer'
import Navbar from '../components/common/Navbar'
import { t } from '../i18n'

/**
 * Layout for all customer-facing pages: header on top, footer at the bottom,
 * and the current page rendered in between via <Outlet />.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-4 py-2 font-semibold text-brand-800 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('Skip to content')}
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* Pages are loaded on demand; show a spinner while one downloads. */}
        <Suspense fallback={<Spinner fullPage />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
