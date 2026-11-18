import { Link } from 'react-router'
import { productsPath } from '../../routes/paths'
import { getOptimizedImageUrl } from '../../services/cloudinaryService'
import { getCategoryStyle } from '../../utils/categoryIcons'
import { getCategoryLabel } from '../../utils/constants'
import useCategories from '../../hooks/useCategories'
import { t, tp } from '../../i18n'

/**
 * "Shop by category" tiles. Each tile uses a real product photo from that
 * category when one exists, otherwise a category emoji.
 */
export default function CategoryTiles({ products }) {
  const { activeCategories } = useCategories()
  if (!activeCategories.length) return null
  const coverByCategory = {}
  const counts = {}
  products.forEach((p) => {
    counts[p.category] = (counts[p.category] ?? 0) + 1
    if (!coverByCategory[p.category] && p.images?.[0]?.url) {
      coverByCategory[p.category] = p.images[0].url
    }
  })

  return (
    <section className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">{t('Shop by category')}</h2>
      <ul className="grid grid-cols-4 gap-3 sm:gap-4 lg:grid-cols-8">
        {activeCategories.map((category) => {
          const style = getCategoryStyle(category.value)
          const cover = coverByCategory[category.value]
          const count = counts[category.value] ?? 0
          return (
            <li key={category.value}>
              <Link
                to={productsPath({ category: category.value })}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span
                  className={`flex aspect-square w-full max-w-24 items-center justify-center overflow-hidden rounded-full ring-2 ring-transparent transition group-hover:ring-brand-400 ${style.bg}`}
                >
                  {cover ? (
                    <img
                      src={getOptimizedImageUrl(cover, { width: 160, height: 160 })}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl" aria-hidden="true">
                      {style.emoji}
                    </span>
                  )}
                </span>
                <span className="text-xs leading-tight font-medium text-gray-800 group-hover:text-brand-700 sm:text-sm">
                  {getCategoryLabel(category.value)}
                </span>
                <span className="sr-only">
                  ({tp(count, '{count} product', '{count} products')})
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
