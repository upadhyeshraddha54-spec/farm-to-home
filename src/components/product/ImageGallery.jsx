import { useState } from 'react'
import { getOptimizedImageUrl } from '../../services/cloudinaryService'
import ProductImage from './ProductImage'
import { localized, t } from '../../i18n'

/** Photo credit line for freely licensed images (e.g. demo photos from Wikimedia Commons). */
function ImageCredit({ credit }) {
  if (!credit) return null
  return (
    <p className="mt-2 text-xs text-gray-500">
      {t('Photo: {author}', { author: credit.author })} ·{' '}
      <a
        href={credit.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-brand-700"
      >
        {t('{license}, via Wikimedia Commons', { license: credit.license })}
      </a>
    </p>
  )
}

/** Main photo with clickable thumbnails underneath (when there is more than one). */
export default function ImageGallery({ product }) {
  const images = product.images ?? []
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? images[0]

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
        {active ? (
          <img
            key={active.url}
            src={getOptimizedImageUrl(active.url, { width: 800, height: 800 })}
            alt={
              images.length > 1
                ? t('{product} — photo {number} of {total}', {
                    product: localized(product, 'name'),
                    number: activeIndex + 1,
                    total: images.length,
                  })
                : localized(product, 'name')
            }
            className="aspect-square w-full object-cover"
          />
        ) : (
          <ProductImage product={product} />
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 relative overflow-x-auto pb-1" aria-label={t('Product photos')}>
          {images.map((image, index) => (
            <li key={image.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={t('Show photo {number}', { number: index + 1 })}
                aria-current={index === activeIndex}
                className={`block overflow-hidden rounded-lg border-2 transition-colors ${
                  index === activeIndex ? 'border-brand-600' : 'border-transparent hover:border-brand-300'
                }`}
              >
                <img
                  src={getOptimizedImageUrl(image.url, { width: 128, height: 128 })}
                  alt=""
                  className="h-16 w-16 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ImageCredit credit={active?.credit} />
    </div>
  )
}
