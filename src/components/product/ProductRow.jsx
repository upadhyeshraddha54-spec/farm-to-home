import { Link } from 'react-router'
import ProductCard from './ProductCard'

/**
 * Titled, horizontally scrolling row of products (like "Fresh arrivals").
 * Swipe on phones; scroll or use Shift+wheel on desktop.
 */
export default function ProductRow({ title, products, seeAllTo }) {
  if (!products.length) return null

  return (
    <section className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h2>
        {seeAllTo && (
          <Link to={seeAllTo} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
            See all
          </Link>
        )}
      </div>
      <ul className="-mx-1 flex snap-x gap-3 relative overflow-x-auto px-1 pb-2">
        {products.map((product) => (
          <li key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
