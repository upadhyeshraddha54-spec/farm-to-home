import { useState } from 'react'
import { getOptimizedImageUrl } from '../../services/cloudinaryService'
import { getCategoryStyle } from '../../utils/categoryIcons'
import { localized } from '../../i18n'

/**
 * Square product photo with a graceful fallback (category emoji) if the
 * product has no image or the image fails to load.
 */
export default function ProductImage({ product, size = 400, className = '', eager = false }) {
  const [failed, setFailed] = useState(false)
  const url = product.images?.[0]?.url
  const style = getCategoryStyle(product.category)

  if (!url || failed) {
    return (
      <div
        className={`flex aspect-square items-center justify-center ${style.bg} ${className}`}
        role="img"
        aria-label={localized(product, 'name')}
      >
        <span className="text-5xl" aria-hidden="true">
          {style.emoji}
        </span>
      </div>
    )
  }

  return (
    <img
      src={getOptimizedImageUrl(url, { width: size, height: size })}
      alt={localized(product, 'name')}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`aspect-square w-full bg-cream-100 object-cover ${className}`}
    />
  )
}
