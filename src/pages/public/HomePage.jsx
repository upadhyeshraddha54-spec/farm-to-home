import { useMemo } from 'react'
import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import FarmCard from '../../components/farm/FarmCard'
import BannerCarousel from '../../components/home/BannerCarousel'
import CategoryTiles from '../../components/home/CategoryTiles'
import ProductRow from '../../components/product/ProductRow'
import Container from '../../components/ui/Container'
import EmptyState from '../../components/ui/EmptyState'
import useAsync from '../../hooks/useAsync'
import useAuth from '../../hooks/useAuth'
import { PATHS, productsPath } from '../../routes/paths'
import { fetchStorefront } from '../../services/marketplaceService'
import { ROLES } from '../../utils/constants'
import { getDiscountPercent } from '../../utils/formatters'

const ROW_SIZE = 12

const VALUE_POINTS = [
  { title: 'Straight from the farm', text: 'Buy directly from the people who grow your food.' },
  { title: 'Know your farmer', text: 'Every product shows the farm it comes from, with ratings from real buyers.' },
  { title: 'Fair for farmers', text: 'Farmers set their own prices — no long chain of middlemen.' },
]

function firstImage(products, category) {
  return products.find((p) => p.category === category && p.images?.[0]?.url)?.images[0].url
}

function buildSlides(products, role) {
  const slides = [
    {
      id: 'fruits',
      eyebrow: 'Seasonal fruit',
      title: 'Orchard-fresh fruit, picked for you',
      text: 'Mangoes, oranges, grapes and more — straight from Maharashtra’s orchards.',
      cta: 'Shop fruits',
      to: productsPath({ category: 'fruits' }),
      image: firstImage(products, 'fruits'),
      tone: 'bg-linear-to-r from-amber-600 to-orange-500',
    },
    {
      id: 'vegetables',
      eyebrow: 'Daily essentials',
      title: 'Farm-fresh vegetables',
      text: 'Onions, tomatoes, greens and more from farms near you.',
      cta: 'Shop vegetables',
      to: productsPath({ category: 'vegetables' }),
      image: firstImage(products, 'vegetables'),
      tone: 'bg-linear-to-r from-brand-800 to-brand-600',
    },
    {
      id: 'grains',
      eyebrow: 'Pantry staples',
      title: 'Dal, grains & millets',
      text: 'Unpolished pulses, local rice, jowar and bajra.',
      cta: 'Shop grains & pulses',
      to: productsPath({ category: 'grains-pulses' }),
      image: firstImage(products, 'grains-pulses'),
      tone: 'bg-linear-to-r from-yellow-800 to-amber-700',
    },
  ]

  // Seller banner: only for visitors who could act on it.
  if (!role) {
    slides.push({
      id: 'sell',
      eyebrow: 'For farmers',
      title: 'Sell your harvest directly',
      text: 'Create a free seller account and reach customers across Maharashtra today.',
      cta: 'Start selling',
      to: PATHS.SIGNUP,
      tone: 'bg-linear-to-r from-brand-900 to-brand-700',
    })
  } else if (role === ROLES.FARMER) {
    slides.push({
      id: 'sell',
      eyebrow: 'For farmers',
      title: 'Manage your farm store',
      text: 'Add products, update stock and see your sales in your dashboard.',
      cta: 'Go to dashboard',
      to: PATHS.FARMER,
      tone: 'bg-linear-to-r from-brand-900 to-brand-700',
    })
  }
  return slides
}

function HomeSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-56 animate-pulse rounded-2xl bg-cream-200 sm:h-72" />
      <div className="h-40 animate-pulse rounded-2xl bg-cream-200" />
      <div className="h-72 animate-pulse rounded-2xl bg-cream-200" />
    </div>
  )
}

export default function HomePage() {
  const { role } = useAuth()
  const storefront = useAsync(fetchStorefront, 'storefront')
  const products = storefront.data?.products
  const farms = storefront.data?.farms

  const sections = useMemo(() => {
    if (!products) return null
    const inCategory = (category) => products.filter((p) => p.category === category).slice(0, ROW_SIZE)
    return {
      newest: products.slice(0, ROW_SIZE),
      deals: products
        .filter((p) => getDiscountPercent(p.price, p.mrp) > 0)
        .sort((a, b) => getDiscountPercent(b.price, b.mrp) - getDiscountPercent(a.price, a.mrp))
        .slice(0, ROW_SIZE),
      fruits: inCategory('fruits'),
      vegetables: inCategory('vegetables'),
      grains: inCategory('grains-pulses'),
      dairy: inCategory('dairy-eggs'),
    }
  }, [products])

  const slides = useMemo(() => buildSlides(products ?? [], role), [products, role])

  return (
    <Container className="space-y-6 py-4 sm:py-6">
      {storefront.error ? (
        <LoadError error={storefront.error} onRetry={storefront.reload} title="We couldn’t load the store" />
      ) : storefront.loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <BannerCarousel slides={slides} />

          <ul className="grid gap-3 sm:grid-cols-3">
            {VALUE_POINTS.map((point) => (
              <li key={point.title} className="rounded-xl border border-cream-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-brand-800">{point.title}</p>
                <p className="text-xs text-gray-600">{point.text}</p>
              </li>
            ))}
          </ul>

          {products.length === 0 ? (
            <EmptyState
              title="The store is just getting started"
              message="Farmers haven’t listed any products yet. Please check back soon."
            />
          ) : (
            <>
              <CategoryTiles products={products} />
              <ProductRow title="Fresh arrivals" products={sections.newest} seeAllTo={PATHS.PRODUCTS} />
              <ProductRow
                title="Best deals"
                products={sections.deals}
                seeAllTo={productsPath({ sort: 'discount' })}
              />
              <ProductRow
                title="Fruits"
                products={sections.fruits}
                seeAllTo={productsPath({ category: 'fruits' })}
              />
              <ProductRow
                title="Vegetables"
                products={sections.vegetables}
                seeAllTo={productsPath({ category: 'vegetables' })}
              />
              <ProductRow
                title="Grains & pulses"
                products={sections.grains}
                seeAllTo={productsPath({ category: 'grains-pulses' })}
              />
              <ProductRow
                title="Dairy & eggs"
                products={sections.dairy}
                seeAllTo={productsPath({ category: 'dairy-eggs' })}
              />

              {farms.length > 0 && (
                <section className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Meet our farmers</h2>
                    <Link to={PATHS.FARMS} className="text-sm font-semibold text-brand-700 hover:underline">
                      See all
                    </Link>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {farms.slice(0, 4).map((farm) => (
                      <li key={farm.id}>
                        <FarmCard farm={farm} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}
    </Container>
  )
}
