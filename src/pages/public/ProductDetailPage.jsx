import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadError from '../../components/common/LoadError'
import FarmAvatar from '../../components/farm/FarmAvatar'
import AddToCart from '../../components/product/AddToCart'
import DemoBadge from '../../components/product/DemoBadge'
import ImageGallery from '../../components/product/ImageGallery'
import PriceTag from '../../components/product/PriceTag'
import ProductRow from '../../components/product/ProductRow'
import RatingStars from '../../components/product/RatingStars'
import ReviewSection from '../../components/product/ReviewSection'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useAsync from '../../hooks/useAsync'
import { farmPath, PATHS, productsPath } from '../../routes/paths'
import { fetchProductPage } from '../../services/marketplaceService'
import { getCategoryLabel, LOW_STOCK_THRESHOLD } from '../../utils/constants'
import { summarizeReviews } from '../../utils/reviews'

function StockStatus({ stock }) {
  if (stock <= 0) {
    return <p className="font-semibold text-red-600">Currently out of stock</p>
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <p className="font-semibold text-amber-700">Only {stock} left in stock</p>
    )
  }
  return <p className="font-semibold text-brand-700">In stock</p>
}

function SellerCard({ product, farm }) {
  const location = farm ? [farm.city, farm.state].filter(Boolean).join(', ') : product.farmLocation
  return (
    <section className="rounded-xl border border-cream-200 bg-cream-50 p-4">
      <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Sold by</h2>
      <div className="mt-2 flex items-center gap-3">
        <FarmAvatar name={product.farmName} />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{product.farmName}</p>
          {location && <p className="text-sm text-gray-500">{location}</p>}
        </div>
      </div>
      {farm?.description && (
        <p className="mt-3 line-clamp-3 text-sm whitespace-pre-line text-gray-700">
          {farm.description}
        </p>
      )}
      {farm && (
        <Link
          to={farmPath(product.farmerId)}
          className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
        >
          Visit farm & see all products →
        </Link>
      )}
    </section>
  )
}

/** Header rating that stays in sync with the review section below. */
function HeaderRating({ reviews }) {
  const rating = summarizeReviews(reviews)
  return (
    <a href="#reviews" className="mt-1 inline-block hover:underline">
      <RatingStars value={rating.average} count={rating.count} showEmpty />
    </a>
  )
}

export default function ProductDetailPage() {
  const { productId } = useParams()
  const page = useAsync(fetchProductPage, productId)
  // Reviews as currently shown (updated when the customer posts/edits one).
  // Keyed by product so navigating to another product resets it.
  const [liveReviews, setLiveReviews] = useState({ productId: null, list: null })

  if (page.loading) {
    return (
      <Container className="py-6">
        <Spinner fullPage />
      </Container>
    )
  }
  if (page.error) {
    return (
      <Container>
        <LoadError error={page.error} onRetry={page.reload} />
      </Container>
    )
  }
  if (!page.data) {
    return (
      <Container className="py-10">
        <EmptyState
          title="Product not available"
          message="This product doesn’t exist or is no longer being sold."
          action={<Button to={PATHS.PRODUCTS}>Browse all products</Button>}
        />
      </Container>
    )
  }

  const { product, farm, moreFromFarm, similar, reviews } = page.data
  const shownReviews = liveReviews.productId === product.id ? liveReviews.list : reviews
  const categoryLabel = getCategoryLabel(product.category)

  return (
    <Container className="py-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: PATHS.HOME },
          { label: categoryLabel, to: productsPath({ category: product.category }) },
          { label: product.name },
        ]}
      />

      {/* A farmer opening their own hidden product */}
      {!product.isActive && (
        <Alert variant="warning" className="mb-4">
          This product is hidden, so customers can’t see this page.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ImageGallery key={product.id} product={product} />

        <div className="space-y-5">
          <div>
            <Link
              to={productsPath({ category: product.category })}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {categoryLabel}
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>
            <HeaderRating reviews={shownReviews} />
            <p className="mt-1 text-sm text-gray-600">
              by{' '}
              {farm ? (
                <Link to={farmPath(product.farmerId)} className="font-medium text-brand-700 hover:underline">
                  {product.farmName}
                </Link>
              ) : (
                <span className="font-medium">{product.farmName}</span>
              )}
              {product.farmLocation && `, ${product.farmLocation}`}
            </p>
            {product.isDemo && (
              <p className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <DemoBadge /> Fictional farm with an illustrative price — for demonstration only.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-cream-200 bg-white p-4">
            <PriceTag price={product.price} mrp={product.mrp} unit={product.unit} size="lg" />
            <div className="mt-3">
              <StockStatus stock={product.stock} />
            </div>
            <div className="mt-4">
              <AddToCart product={product} />
            </div>
          </div>

          {product.description && (
            <section>
              <h2 className="mb-2 text-base font-semibold text-gray-900">About this product</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">
                {product.description}
              </p>
            </section>
          )}

          <SellerCard product={product} farm={farm} />
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <ReviewSection
          key={product.id}
          product={product}
          initialReviews={reviews}
          onReviewsChange={(list) => setLiveReviews({ productId: product.id, list })}
        />
        <ProductRow
          title={`More from ${product.farmName}`}
          products={moreFromFarm}
          seeAllTo={farm ? farmPath(product.farmerId) : undefined}
        />
        <ProductRow
          title={`More ${categoryLabel.toLowerCase()} from other farms`}
          products={similar}
          seeAllTo={productsPath({ category: product.category })}
        />
      </div>
    </Container>
  )
}
