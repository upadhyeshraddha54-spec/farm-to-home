import { useCallback, useMemo, useState } from 'react'
import useCategories from '../../hooks/useCategories'
import { getCategoryLabel, getStockLabel, getUnitLabel, getUnitOptions } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatPrice, getDiscountPercent } from '../../utils/formatters'
import { EMPTY_PRODUCT, PRODUCT_LIMITS, validateProduct } from '../../utils/productValidation'
import { hasNoErrors } from '../../utils/validators'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Switch from '../ui/Switch'
import Textarea from '../ui/Textarea'
import TranslationFields from '../common/TranslationFields'
import ImageUploader from './ImageUploader'
import { t } from '../../i18n'

/**
 * Add / edit product form.
 * `onSubmit(values)` should save and may throw; errors are shown on the form.
 * `adminHidden`: an admin has hidden this product, so the farmer can't relist it.
 */
export default function ProductForm({
  initialValues = EMPTY_PRODUCT,
  submitLabel,
  onSubmit,
  onCancel,
  adminHidden = false,
}) {
  const { activeCategories, loading: categoriesLoading } = useCategories()
  const [values, setValues] = useState(initialValues)
  // Active categories, plus the product's current one if it has since been
  // switched off (keeping it unchanged is allowed).
  const categoryOptions = useMemo(() => {
    const options = activeCategories.map((c) => ({ value: c.value, label: getCategoryLabel(c.value) }))
    const current = initialValues.category
    if (current && !options.some((c) => c.value === current)) {
      options.push({ value: current, label: t('{category} (no longer offered)', { category: getCategoryLabel(current) }) })
    }
    return options
  }, [activeCategories, initialValues.category])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleTranslationChange(code, field, value) {
    setValues((prev) => ({
      ...prev,
      translations: { ...prev.translations, [code]: { ...prev.translations?.[code], [field]: value } },
    }))
    setErrors((prev) => ({ ...prev, translations: '' }))
  }

  const setImages = useCallback((updater) => {
    setValues((prev) => ({ ...prev, images: updater(prev.images) }))
    setErrors((prev) => ({ ...prev, images: '' }))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const nextErrors = validateProduct(values, categoryOptions)
    setErrors(nextErrors)
    if (!hasNoErrors(nextErrors)) {
      setFormError(t('Please fix the highlighted fields.'))
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error))
      setSubmitting(false)
    }
  }

  const discount = getDiscountPercent(Number(values.price), Number(values.mrp))
  const showPreview = Number(values.price) > 0

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && <Alert variant="error">{formError}</Alert>}

      <section className="space-y-4 rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-gray-900">{t('Product details')}</h2>
        <Input
          label={t('Product name')}
          name="name"
          placeholder={t('e.g. Organic Tomatoes')}
          maxLength={PRODUCT_LIMITS.NAME_MAX}
          value={values.name}
          onChange={handleChange}
          error={errors.name}
        />
        <Select
          label={t('Category')}
          name="category"
          placeholder={t('Select a category')}
          options={categoryOptions}
          value={values.category}
          onChange={handleChange}
          error={
            errors.category ||
            (!categoriesLoading && categoryOptions.length === 0
              ? t('Categories are being set up — this usually takes a moment. If this message stays, please reload the page or contact support.')
              : '')
          }
        />
        <Textarea
          label={t('Description (optional)')}
          name="description"
          placeholder={t('How it’s grown, taste, freshness, storage tips…')}
          maxLength={PRODUCT_LIMITS.DESCRIPTION_MAX}
          value={values.description}
          onChange={handleChange}
          error={errors.description}
        />
        <TranslationFields
          fields={[
            { name: 'name', label: t('Product name'), maxLength: PRODUCT_LIMITS.NAME_MAX },
            { name: 'description', label: t('Description'), multiline: true, maxLength: PRODUCT_LIMITS.DESCRIPTION_MAX },
          ]}
          values={values.translations}
          onChange={handleTranslationChange}
          error={errors.translations}
        />
      </section>

      <section className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
        <ImageUploader
          images={values.images}
          setImages={setImages}
          onBusyChange={setUploading}
          error={errors.images}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-gray-900">{t('Price & stock')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label={t('Sold')}
            name="unit"
            options={getUnitOptions()}
            value={values.unit}
            onChange={handleChange}
            error={errors.unit}
          />
          <Input
            label={t('Selling price (₹)')}
            name="price"
            inputMode="decimal"
            placeholder="40"
            value={values.price}
            onChange={handleChange}
            error={errors.price}
          />
          <Input
            label={t('MRP (₹, optional)')}
            name="mrp"
            inputMode="decimal"
            placeholder="50"
            value={values.mrp}
            onChange={handleChange}
            error={errors.mrp}
            hint={t('Shows a discount if higher than your price.')}
          />
        </div>
        <Input
          label={getStockLabel(values.unit)}
          name="stock"
          inputMode="numeric"
          placeholder="100"
          value={values.stock}
          onChange={handleChange}
          error={errors.stock}
          className="sm:max-w-xs"
        />

        {showPreview && (
          <p className="rounded-lg bg-cream-100 px-3 py-2 text-sm text-gray-700">
            {t('Customers will see:')}{' '}
            <strong className="text-gray-900">{formatPrice(values.price)}</strong>{' '}
            {getUnitLabel(values.unit)}
            {discount > 0 && (
              <>
                {' '}
                <span className="text-gray-500 line-through">{formatPrice(values.mrp)}</span>{' '}
                <span className="font-semibold text-brand-700">{t('{percent}% off', { percent: discount })}</span>
              </>
            )}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
        <Switch
          checked={values.isActive && !adminHidden}
          onChange={(isActive) => setValues((prev) => ({ ...prev, isActive }))}
          disabled={adminHidden}
          label={t('Show this product to customers')}
        />
        <p className="mt-2 text-xs text-gray-500">
          {adminHidden
            ? t('An admin has hidden this product. Contact support to have it reviewed.')
            : t('Turn off to hide it from the store without deleting it.')}
        </p>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            {t('Cancel')}
          </Button>
        )}
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? t('Saving…') : uploading ? t('Waiting for uploads…') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
