import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import useAsync from '../../hooks/useAsync'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { PATHS } from '../../routes/paths'
import {
  deleteReview,
  fetchProductReviews,
  findDeliveredOrderFor,
  reviewerDisplayName,
  saveReview,
} from '../../services/reviewService'
import { REVIEW_COMMENT_MAX, ROLES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDate } from '../../utils/formatters'
import { ratingHistogram, summarizeReviews } from '../../utils/reviews'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Spinner from '../ui/Spinner'
import Textarea from '../ui/Textarea'
import RatingStars, { RatingInput } from './RatingStars'
import { t, tx } from '../../i18n'

// Stable loader for useAsync: "uid|productId|farmerId" → order ID or null.
const loadEligibility = (key) => {
  const [uid, id, farmerId] = key.split('|')
  return findDeliveredOrderFor(uid, { id, farmerId })
}

function ReviewForm({ product, orderId, existing, customerName, uid, onSaved, onCancel }) {
  const toast = useToast()
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!rating) {
      setError(t('Please choose a star rating.'))
      return
    }
    setSaving(true)
    try {
      await saveReview(
        { uid, product, orderId: existing?.orderId ?? orderId, customerName, rating, comment },
        { isNew: !existing },
      )
      toast.success(existing ? t('Your review was updated.') : t('Thanks for your review!'))
      onSaved()
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4 sm:p-5">
      <h3 className="font-semibold text-gray-900">{existing ? t('Edit your review') : t('Write a review')}</h3>
      <RatingInput value={rating} onChange={(v) => { setRating(v); setError('') }} error={error} />
      <Textarea
        label={t('Your review (optional)')}
        value={comment}
        maxLength={REVIEW_COMMENT_MAX}
        placeholder={t('Freshness, taste, packing, delivery…')}
        onChange={(e) => setComment(e.target.value)}
      />
      <p className="text-xs text-gray-500">{t('Posted publicly as “{name}” with a “Verified purchase” label.', { name: customerName })}</p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? t('Saving…') : existing ? t('Save changes') : t('Post review')}</Button>
        {onCancel && <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>{t('Cancel')}</Button>}
      </div>
    </form>
  )
}

/**
 * Ratings summary, review list and (for eligible customers) the review form.
 * `initialReviews` come with the product page; the list refreshes after
 * changes and `onReviewsChange(reviews)` tells the page (for the header rating).
 */
export default function ReviewSection({ product, initialReviews = [], onReviewsChange }) {
  const { user, profile, role } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [reviews, setReviews] = useState(initialReviews)
  const [editing, setEditing] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const summary = summarizeReviews(reviews)
  const histogram = ratingHistogram(reviews)
  const mine = user ? reviews.find((r) => r.id === user.uid) : null
  const isCustomer = role === ROLES.CUSTOMER

  // Can this customer review it? (Only checked for customers who haven't yet.)
  const eligibility = useAsync(
    loadEligibility,
    user && isCustomer && !mine ? `${user.uid}|${product.id}|${product.farmerId}` : null,
  )
  const checking = eligibility.loading
  const eligibleOrderId = eligibility.data ?? null

  async function refresh() {
    setEditing(false)
    try {
      const latest = await fetchProductReviews(product.id)
      setReviews(latest)
      onReviewsChange?.(latest)
    } catch {
      // The toast already confirmed the save; the list refreshes on next visit.
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteReview(product.id, toDelete.id)
      toast.success(t('Review deleted.'))
      setToDelete(null)
      await refresh()
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section id="reviews" className="scroll-mt-24 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-lg font-bold text-gray-900 sm:text-xl">{t('Customer reviews')}</h2>

      <div className="mt-4 grid gap-6 md:grid-cols-[14rem_1fr]">
        {/* Summary */}
        <div>
          {summary.count ? (
            <>
              <p className="text-4xl font-bold text-gray-900">{summary.average}<span className="text-lg text-gray-500"> / 5</span></p>
              <RatingStars value={summary.average} count={summary.count} className="mt-1" />
              <ul className="mt-3 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <li key={star} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-6">{star}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <span className="block h-full bg-accent-500" style={{ width: `${(histogram[star] / summary.count) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right">{histogram[star]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-600">{t('No reviews yet. Be the first to review this product after it’s delivered to you.')}</p>
          )}
        </div>

        {/* Form / call to action */}
        <div className="space-y-4">
          {!user && (
            <p className="text-sm text-gray-600">
              {tx('<signin>Sign in</signin> to review products you’ve bought.', {
                signin: (text) => (
                  <Link to={PATHS.LOGIN} state={{ from: location }} className="font-semibold text-brand-700 hover:underline">
                    {text}
                  </Link>
                ),
              })}
            </p>
          )}
          {user && isCustomer && mine && !editing && (
            <div className="rounded-xl border border-cream-200 bg-cream-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">{t('Your review')}</p>
              <RatingStars value={mine.rating} count={1} className="mt-1" />
              {mine.comment && <p className="mt-2 whitespace-pre-line text-gray-700">{mine.comment}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{t('Edit')}</Button>
                <Button size="sm" variant="danger-ghost" onClick={() => setToDelete(mine)}>{t('Delete')}</Button>
              </div>
            </div>
          )}
          {user && isCustomer && mine && editing && (
            <ReviewForm product={product} existing={mine} customerName={mine.customerName} uid={user.uid} onSaved={refresh} onCancel={() => setEditing(false)} />
          )}
          {user && isCustomer && !mine && (checking ? (
            <Spinner />
          ) : eligibleOrderId ? (
            <ReviewForm product={product} orderId={eligibleOrderId} customerName={reviewerDisplayName(profile?.name)} uid={user.uid} onSaved={refresh} />
          ) : (
            <Alert variant="info">
              {t('You can review this product once an order containing it has been delivered to you.')}
            </Alert>
          ))}
          {user && !isCustomer && (
            <p className="text-sm text-gray-600">{t('Only customers who bought a product can review it.')}</p>
          )}
        </div>
      </div>

      {/* List */}
      {reviews.length > 0 && (
        <ul className="mt-6 divide-y divide-gray-100 border-t border-gray-100">
          {reviews.map((review) => (
            <li key={review.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <RatingStars value={review.rating} count={1} size="sm" />
                  <span className="text-sm font-semibold text-gray-900">{review.customerName}</span>
                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[11px] font-semibold text-brand-800">{t('Verified purchase')}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
              </div>
              {review.comment && <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{review.comment}</p>}
              {role === ROLES.ADMIN && (
                <button type="button" onClick={() => setToDelete(review)} className="mt-2 text-xs font-medium text-red-600 hover:underline">
                  {t('Remove review (admin)')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('Delete this review?')}
        message={t('This can’t be undone.')}
        confirmLabel={t('Delete')}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  )
}
