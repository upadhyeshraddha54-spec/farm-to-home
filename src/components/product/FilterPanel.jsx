
import { useState } from 'react'
import { PRICE_RANGES } from '../../utils/marketplace'
import Button from '../ui/Button'

function FilterSection({ title, children }) {
  return (
    <fieldset className="border-b border-gray-100 py-4 first:pt-0 last:border-b-0">
      <legend className="mb-2 text-sm font-semibold text-gray-900">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

const optionClass = (active) =>
  `flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
    active
      ? 'bg-brand-50 font-semibold text-brand-800'
      : 'text-gray-700 hover:bg-gray-50'
  }`

/** Custom min/max price inputs. */
function PriceInputs({ min, max, onApply }) {
  const [values, setValues] = useState({
    min: min ?? '',
    max: max ?? '',
  })

  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const nextMin = values.min === '' ? null : Number(values.min)
    const nextMax = values.max === '' ? null : Number(values.max)

    if (
      [nextMin, nextMax].some(
        (v) => v != null && (!Number.isFinite(v) || v < 0)
      )
    ) {
      setError('Enter prices as positive numbers.')
      return
    }

    if (nextMin != null && nextMax != null && nextMin > nextMax) {
      setError('Minimum can’t be more than maximum.')
      return
    }

    setError('')
    onApply({ min: nextMin, max: nextMax })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3" noValidate>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="price-min">
          Minimum price
        </label>

        <input
          id="price-min"
          inputMode="decimal"
          placeholder="₹ Min"
          value={values.min}
          onChange={(e) =>
            setValues((v) => ({ ...v, min: e.target.value }))
          }
          className="h-9 w-full min-w-0 rounded-md border border-gray-300 px-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />

        <span className="text-gray-400" aria-hidden="true">
          –
        </span>

        <label className="sr-only" htmlFor="price-max">
          Maximum price
        </label>

        <input
          id="price-max"
          inputMode="decimal"
          placeholder="₹ Max"
          value={values.max}
          onChange={(e) =>
            setValues((v) => ({ ...v, max: e.target.value }))
          }
          className="h-9 w-full min-w-0 rounded-md border border-gray-300 px-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />

        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="shrink-0"
        >
          Go
        </Button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </form>
  )
}

/**
 * Category and price filters for the product listing.
 * onChange(changes) receives only the filters that changed.
 */
export default function FilterPanel({
  filters,
  categories,
  categoryCounts,
  onChange,
}) {
  return (
    <div className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm">

      {/* CATEGORY FILTER */}
      <FilterSection title="Category">
        <ul className="category-scrollbar max-h-56 space-y-0.5 overflow-y-auto overscroll-contain pr-2">
          <li>
            <button
              type="button"
              className={optionClass(!filters.category)}
              aria-pressed={!filters.category}
              onClick={() => onChange({ category: '' })}
            >
              All categories
            </button>
          </li>

          {categories.map((category) => {
            const count = categoryCounts[category.value] ?? 0
            const active = filters.category === category.value

            return (
              <li key={category.value}>
                <button
                  type="button"
                  className={optionClass(active)}
                  aria-pressed={active}
                  disabled={count === 0 && !active}
                  onClick={() =>
                    onChange({
                      category: active ? '' : category.value,
                    })
                  }
                >
                  <span
                    className={
                      count === 0 && !active ? 'text-gray-400' : ''
                    }
                  >
                    {category.label}
                  </span>

                  <span className="text-xs text-gray-400">
                    {count}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </FilterSection>

      {/* PRICE FILTER */}
      <FilterSection title="Price">
        <ul className="space-y-0.5">
          {PRICE_RANGES.map((range) => {
            const active =
              filters.min === range.min &&
              filters.max === range.max

            return (
              <li key={range.label}>
                <button
                  type="button"
                  className={optionClass(active)}
                  aria-pressed={active}
                  onClick={() =>
                    onChange(
                      active
                        ? { min: null, max: null }
                        : { min: range.min, max: range.max }
                    )
                  }
                >
                  {range.label}
                </button>
              </li>
            )
          })}
        </ul>

        <PriceInputs
          key={`${filters.min}-${filters.max}`}
          min={filters.min}
          max={filters.max}
          onApply={onChange}
        />
      </FilterSection>

    </div>
  )
}
