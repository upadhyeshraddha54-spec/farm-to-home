import { Link } from 'react-router'
import { productPath } from '../../routes/paths'
import { LOW_STOCK_THRESHOLD } from '../../utils/constants'
import DemoBadge from './DemoBadge'
import PriceTag from './PriceTag'
import ProductImage from './ProductImage'
import RatingStars from './RatingStars'

/** Product tile used in grids and rows. The whole card links to the product page. */
export default function ProductCard({ product }) {
  const lowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD

  return (
    <Link
      to={productPath(product.id)}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          product={product}
          size={400}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {product.isDemo && <DemoBadge className="absolute top-2 left-2" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-brand-700">
          {product.name}
        </h3>
        <p className="truncate text-xs text-gray-500">
          {product.farmName}
          {product.farmLocation && ` · ${product.farmLocation.split(',')[0]}`}
        </p>
        {product.rating?.count > 0 && (
          <RatingStars value={product.rating.average} count={product.rating.count} size="sm" />
        )}
        <div className="mt-auto pt-1">
          <PriceTag price={product.price} mrp={product.mrp} unit={product.unit} />
          {lowStock && (
            <p className="mt-1 text-xs font-medium text-amber-700">Only {product.stock} left</p>
          )}
        </div>
      </div>
    </Link>
  )
}
