import ProductCard from './ProductCard'

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5'

/** Responsive product grid: 2 columns on phones up to 5 on wide screens. */
export default function ProductGrid({ products, className = '' }) {
  return (
    <ul className={`${GRID} ${className}`}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}

/** Grey placeholder cards shown while products load. */
export function ProductGridSkeleton({ count = 10, className = '' }) {
  return (
    <ul className={`${GRID} ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-xl border border-cream-200 bg-white">
          <div className="aspect-square animate-pulse bg-cream-200" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-4/5 animate-pulse rounded bg-cream-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-cream-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-cream-200" />
          </div>
        </li>
      ))}
    </ul>
  )
}
