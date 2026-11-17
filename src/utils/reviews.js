/** { count, average } for a list of reviews (average rounded to 1 decimal, 0 if none). */
export function summarizeReviews(reviews = []) {
  const count = reviews.length
  if (!count) return { count: 0, average: 0 }
  const sum = reviews.reduce((total, r) => total + (Number(r.rating) || 0), 0)
  return { count, average: Math.round((sum / count) * 10) / 10 }
}

/** Map of key (e.g. productId or farmerId) → { count, average }. */
export function ratingsByKey(reviews = [], key) {
  const groups = new Map()
  reviews.forEach((review) => {
    const id = review[key]
    if (!id) return
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id).push(review)
  })
  const result = new Map()
  groups.forEach((list, id) => result.set(id, summarizeReviews(list)))
  return result
}

/** Returns copies of `items` with a `rating: { count, average }` from the map. */
export function attachRatings(items, ratings, key = 'id') {
  return items.map((item) => ({ ...item, rating: ratings.get(item[key]) ?? { count: 0, average: 0 } }))
}

/** How many reviews gave each star, e.g. { 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 }. */
export function ratingHistogram(reviews = []) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r) => {
    if (counts[r.rating] != null) counts[r.rating] += 1
  })
  return counts
}
