import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getOptimizedImageUrl } from '../../services/cloudinaryService'

const INTERVAL_MS = 6000

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Auto-rotating promo banners with previous/next, dots and a pause button.
 * Each slide: { id, eyebrow, title, text, cta, to, image?, tone }
 * Rotation pauses on hover/focus and is off for users who prefer reduced motion.
 */
export default function BannerCarousel({ slides }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(prefersReducedMotion)
  const [hovering, setHovering] = useState(false)
  const count = slides.length
  const current = Math.min(index, count - 1)

  useEffect(() => {
    if (paused || hovering || count < 2) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [paused, hovering, count])

  if (!count) return null
  const go = (next) => setIndex((next + count) % count)

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative overflow-hidden rounded-2xl shadow-sm"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== current}
            className={`relative flex min-h-56 w-full shrink-0 items-center sm:min-h-72 ${slide.tone}`}
          >
            {slide.image && (
              <img
                src={getOptimizedImageUrl(slide.image, { width: 900, height: 600 })}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover sm:block"
              />
            )}
            {slide.image && (
              <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-linear-to-r from-black/40 to-transparent sm:block" />
            )}
            <div className="relative z-10 max-w-xl px-6 py-8 pb-12 sm:w-1/2 sm:max-w-none sm:px-16">
              <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">
                {slide.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl leading-tight font-extrabold text-white sm:text-4xl">
                {slide.title}
              </h2>
              <p className="mt-2 text-sm text-white/90 sm:text-base">{slide.text}</p>
              <Link
                to={slide.to}
                tabIndex={i === current ? 0 : -1}
                className="mt-5 inline-flex h-11 items-center rounded-lg bg-accent-500 px-5 text-sm font-semibold text-gray-900 transition-colors hover:bg-accent-400"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous banner"
            className="absolute top-1/2 left-2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl text-gray-800 shadow hover:bg-white sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next banner"
            className="absolute top-1/2 right-2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl text-gray-800 shadow hover:bg-white sm:flex"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show banner ${i + 1}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`}
              />
            ))}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Play banners' : 'Pause banners'}
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-[10px] text-white hover:bg-black/50"
            >
              {paused ? '▶' : '❚❚'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
