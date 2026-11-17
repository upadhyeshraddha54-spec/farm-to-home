import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { productsPath } from '../../routes/paths'

/**
 * Store-wide search. Submitting opens the product listing with ?q=…
 * `initialQuery` pre-fills the box (the current search, when on the listing).
 * Pass the display class in `className` (e.g. "flex" or "hidden md:flex").
 */
export default function SearchBar({ initialQuery = '', className = '' }) {
  const navigate = useNavigate()
  const inputId = useId()
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(event) {
    event.preventDefault()
    navigate(productsPath({ q: query.trim() }))
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={`w-full ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search vegetables, fruits, dal, farms…"
        maxLength={100}
        autoComplete="off"
        className="h-10 min-w-0 flex-1 rounded-l-lg border-0 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-accent-400 focus:outline-none"
      />
      <button
        type="submit"
        className="flex h-10 w-12 shrink-0 items-center justify-center rounded-r-lg bg-accent-500 text-gray-900 transition-colors hover:bg-accent-400"
        aria-label="Search"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8.5 3a5.5 5.5 0 1 0 3.3 9.9l3.7 3.6 1.4-1.4-3.6-3.7A5.5 5.5 0 0 0 8.5 3Zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
          />
        </svg>
      </button>
    </form>
  )
}
