import { Link } from 'react-router'
import { PATHS, productsPath } from '../../routes/paths'
import useCategories from '../../hooks/useCategories'
import { APP_NAME, APP_TAGLINE } from '../../utils/constants'
import Container from '../ui/Container'
import Logo from './Logo'

const CURRENT_YEAR = new Date().getFullYear()

const linkClass = 'text-sm text-brand-200 hover:text-white hover:underline'

export default function Footer() {
  const { activeCategories } = useCategories()
  return (
    <footer className="mt-auto bg-brand-900 text-brand-100">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <Logo light />
          <p className="max-w-sm text-sm text-brand-200">
            {APP_TAGLINE}. A marketplace where farmers sell directly to the people who eat their
            food.
          </p>
        </div>

        <nav aria-label="Shop">
          <h2 className="mb-3 text-sm font-semibold text-white">Shop</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1">
            <li>
              <Link to={PATHS.PRODUCTS} className={linkClass}>All products</Link>
            </li>
            {activeCategories.slice(0, 5).map((category) => (
              <li key={category.value}>
                <Link to={productsPath({ category: category.value })} className={linkClass}>
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Farmers">
          <h2 className="mb-3 text-sm font-semibold text-white">Farmers</h2>
          <ul className="space-y-2">
            <li>
              <Link to={PATHS.FARMS} className={linkClass}>Our farmers</Link>
            </li>
            <li>
              <Link to={PATHS.SIGNUP} className={linkClass}>Sell on {APP_NAME}</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Help">
          <h2 className="mb-3 text-sm font-semibold text-white">Help</h2>
          <ul className="space-y-2">
            <li><Link to={PATHS.CONTACT} className={linkClass}>Contact us</Link></li>
            <li><Link to={PATHS.SHIPPING} className={linkClass}>Shipping & delivery</Link></li>
            <li><Link to={PATHS.CANCELLATION} className={linkClass}>Cancellations</Link></li>
            <li><Link to={PATHS.RETURNS} className={linkClass}>Returns & refunds</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="mb-3 text-sm font-semibold text-white">Company</h2>
          <ul className="space-y-2">
            <li><Link to={PATHS.ABOUT} className={linkClass}>About us</Link></li>
            <li><Link to={PATHS.PRIVACY} className={linkClass}>Privacy policy</Link></li>
            <li><Link to={PATHS.TERMS} className={linkClass}>Terms of use</Link></li>
          </ul>
        </nav>
      </Container>
      <div className="border-t border-brand-800">
        <Container className="py-4">
          <p className="text-xs text-brand-300">
            © {CURRENT_YEAR} {APP_NAME}. All rights reserved. Listings marked “Demo” are fictional
            examples.
          </p>
        </Container>
      </div>
    </footer>
  )
}
