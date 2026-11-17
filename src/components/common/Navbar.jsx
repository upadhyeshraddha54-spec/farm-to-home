import { NavLink, useLocation, useSearchParams } from 'react-router'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import useSignOut from '../../hooks/useSignOut'
import { PATHS, productsPath } from '../../routes/paths'
import useCategories from '../../hooks/useCategories'
import { ROLES } from '../../utils/constants'
import Button from '../ui/Button'
import Container from '../ui/Container'
import Logo from './Logo'
import SearchBar from './SearchBar'

const navLinkClass = ({ isActive }) =>
  `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-800 text-white' : 'text-brand-50 hover:bg-brand-600 hover:text-white'
  }`

/** Cart button with item count — for visitors and customers only. */
function CartLink() {
  const { count } = useCart()
  return (
    <NavLink
      to={PATHS.CART}
      className={({ isActive }) =>
        `relative flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-800 text-white' : 'text-brand-50 hover:bg-brand-600 hover:text-white'
        }`
      }
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3 3h2l2.6 10.4A2 2 0 0 0 9.5 15h7.9a2 2 0 0 0 1.9-1.4L21.5 7H6.3L5.6 4.3A1.7 1.7 0 0 0 4 3H3Z"
        />
      </svg>
      <span className="hidden lg:inline">Cart</span>
      {count > 0 && (
        <span className="absolute -top-0.5 left-6 min-w-5 rounded-full bg-accent-500 px-1 text-center text-xs leading-5 font-bold text-gray-900 lg:static lg:ml-0.5">
          {count}
        </span>
      )}
    </NavLink>
  )
}

function AccountControls() {
  const { user, profile, loading } = useAuth()
  const { signOut, signingOut } = useSignOut()

  // Avoid flashing "Sign in" while Firebase is still checking the session.
  if (loading) return <div className="h-9 w-20" aria-hidden="true" />

  if (!user) {
    return (
      <>
        <CartLink />
        <NavLink to={PATHS.LOGIN} className={navLinkClass}>
          Sign in
        </NavLink>
        {/* Wrapper controls visibility: Button always sets its own display. */}
        <span className="hidden lg:block">
          <Button to={PATHS.SIGNUP} variant="accent" size="sm">
            Create account
          </Button>
        </span>
      </>
    )
  }

  const firstName = profile?.name?.split(' ')[0]

  const role = profile?.role
  return (
    <>
      {role === ROLES.FARMER && (
        <NavLink to={PATHS.FARMER} className={navLinkClass}>
          Dashboard
        </NavLink>
      )}
      {role === ROLES.ADMIN && (
        <NavLink to={PATHS.ADMIN} className={navLinkClass}>
          Admin
        </NavLink>
      )}
      {role === ROLES.CUSTOMER && (
        <NavLink to={PATHS.ORDERS} className={(state) => `${navLinkClass(state)} hidden sm:block`}>
          Orders
        </NavLink>
      )}
      {role === ROLES.CUSTOMER && <CartLink />}
      <NavLink to={PATHS.ACCOUNT} className={navLinkClass}>
        <span className="hidden sm:inline">{firstName ? `Hi, ${firstName}` : 'Account'}</span>
        <span className="sm:hidden">Account</span>
      </NavLink>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="hidden rounded-md px-3 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 hover:text-white disabled:opacity-60 sm:block"
      >
        Sign out
      </button>
    </>
  )
}

/** Flipkart-style strip of category links under the header. */
function CategoryStrip() {
  const { activeCategories } = useCategories()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const onListing = location.pathname === PATHS.PRODUCTS
  const activeCategory = onListing ? searchParams.get('category') : null

  const linkClass = (active) =>
    `block whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-brand-700 text-white' : 'text-brand-900 hover:bg-brand-100'
    }`

  return (
    <nav aria-label="Categories" className="border-b border-cream-200 bg-white">
      <Container>
        <ul className="-mx-1 flex gap-1 relative overflow-x-auto py-2">
          <li>
            <NavLink
              to={PATHS.PRODUCTS}
              className={() => linkClass(onListing && !activeCategory)}
            >
              All products
            </NavLink>
          </li>
          {activeCategories.map((category) => (
            <li key={category.value}>
              <NavLink
                to={productsPath({ category: category.value })}
                className={() => linkClass(activeCategory === category.value)}
              >
                {category.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to={PATHS.FARMS} className={({ isActive }) => linkClass(isActive)}>
              Our farmers
            </NavLink>
          </li>
        </ul>
      </Container>
    </nav>
  )
}

export default function Navbar() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  // Keep the current search in the box while browsing results.
  const currentQuery = location.pathname === PATHS.PRODUCTS ? (searchParams.get('q') ?? '') : ''

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-700 shadow-md">
        <Container className="flex h-16 items-center justify-between gap-3 lg:gap-6">
          <Logo light />
          <SearchBar
            key={`desktop-${currentQuery}`}
            initialQuery={currentQuery}
            className="hidden max-w-2xl md:flex"
          />
          <nav aria-label="Account" className="flex shrink-0 items-center gap-1">
            <AccountControls />
          </nav>
        </Container>
        <Container className="pb-3 md:hidden">
          <SearchBar key={`mobile-${currentQuery}`} initialQuery={currentQuery} className="flex" />
        </Container>
      </header>
      <CategoryStrip />
    </>
  )
}
