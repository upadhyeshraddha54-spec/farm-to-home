import { useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import Switch from '../../components/ui/Switch'
import useCategories from '../../hooks/useCategories'
import useToast from '../../hooks/useToast'
import {
  addMissingDefaultCategories,
  countProductsInCategory,
  deleteCategory,
  saveCategory,
} from '../../services/categoryService'
import { CATEGORY_SLUG_PATTERN, DEFAULT_CATEGORIES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { CONTENT_LANGUAGES, translationsToForm } from '../../utils/translations'
import { t, tp } from '../../i18n'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function validateCategory(values) {
  return {
    label: values.label.trim().length < 2 || values.label.trim().length > 40 ? t('Name must be 2–40 characters.') : '',
    slug: CATEGORY_SLUG_PATTERN.test(values.slug) ? '' : t('Use lowercase letters, numbers and single hyphens.'),
    emoji: [...values.emoji.trim()].length > 4 ? t('Use one emoji (or leave empty).') : '',
    sortOrder: /^\d{1,4}$/.test(String(values.sortOrder)) && Number(values.sortOrder) <= 1000 ? '' : t('Enter 0–1000.'),
  }
}

/** One editable category row. */
function CategoryRow({ category, onDelete }) {
  const toast = useToast()
  const [values, setValues] = useState({
    label: category.label,
    emoji: category.emoji,
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
    translations: translationsToForm(category, ['label']),
  })
  const [saving, setSaving] = useState(false)
  const changed =
    values.label !== category.label ||
    values.emoji !== category.emoji ||
    Number(values.sortOrder) !== category.sortOrder ||
    values.isActive !== category.isActive ||
    CONTENT_LANGUAGES.some(
      ({ code }) =>
        values.translations[code].label.trim() !== (category.translations?.[code]?.label ?? ''),
    )

  async function save(next = values) {
    const errors = validateCategory({ ...next, slug: category.value })
    const firstError = Object.values(errors).find(Boolean)
    if (firstError) {
      toast.error(firstError)
      return
    }
    setSaving(true)
    try {
      await saveCategory(category.value, next, { isNew: false })
      toast.success(t('Saved “{name}”.', { name: next.label.trim() }))
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="grid items-end gap-3 p-4 sm:grid-cols-[4rem_1fr_6rem_auto_auto]">
      <div className="grid gap-3 sm:col-span-5 sm:grid-cols-2 sm:order-last">
        {CONTENT_LANGUAGES.map(({ code, label }) => (
          <Input
            key={code}
            lang={code}
            label={t('Name in {language} (optional)', { language: label })}
            value={values.translations[code].label}
            maxLength={40}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                translations: { ...v.translations, [code]: { label: e.target.value } },
              }))
            }
          />
        ))}
      </div>
      <Input label={t('Emoji')} value={values.emoji} maxLength={8} onChange={(e) => setValues((v) => ({ ...v, emoji: e.target.value }))} />
      <Input label={t('Name · {id}', { id: category.value })} value={values.label} maxLength={40} onChange={(e) => setValues((v) => ({ ...v, label: e.target.value }))} />
      <Input label={t('Order')} inputMode="numeric" value={values.sortOrder} onChange={(e) => setValues((v) => ({ ...v, sortOrder: e.target.value }))} />
      <div className="pb-2">
        <Switch
          checked={values.isActive}
          label={values.isActive ? t('Shown') : t('Hidden')}
          disabled={saving}
          onChange={(isActive) => {
            const next = { ...values, isActive }
            setValues(next)
            save(next)
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => save()} disabled={!changed || saving}>
          {saving ? t('Saving…') : t('Save')}
        </Button>
        <Button size="sm" variant="danger-ghost" onClick={() => onDelete(category)} disabled={saving}>
          {t('Delete')}
        </Button>
      </div>
    </li>
  )
}

export default function AdminCategoriesPage() {
  const toast = useToast()
  const { categories, loading, error } = useCategories()
  const [form, setForm] = useState({ label: '', slug: '', emoji: '', sortOrder: '100' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const missingDefaults = DEFAULT_CATEGORIES.filter((d) => !categories.some((c) => c.value === d.value))

  async function addDefaults() {
    try {
      const added = await addMissingDefaultCategories()
      toast.success(tp(added, 'Added {count} default category.', 'Added {count} default categories.'))
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err))
    }
  }

  async function handleAdd(event) {
    event.preventDefault()
    const next = validateCategory(form)
    if (categories.some((c) => c.value === form.slug)) next.slug = t('A category with this ID already exists.')
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setAdding(true)
    try {
      await saveCategory(form.slug, { ...form, isActive: true }, { isNew: true })
      toast.success(t('Added “{name}”.', { name: form.label.trim() }))
      setForm({ label: '', slug: '', emoji: '', sortOrder: '100' })
      setSlugTouched(false)
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const inUse = await countProductsInCategory(toDelete.value)
      if (inUse > 0) {
        toast.error(
          tp(inUse, '“{name}” is used by {count} product. Hide it instead.', '“{name}” is used by {count} products. Hide it instead.', {
            name: toDelete.label,
          }),
        )
      } else {
        await deleteCategory(toDelete.value)
        toast.success(t('Deleted “{name}”.', { name: toDelete.label }))
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageMeta title={t('Categories')} noIndex />
      <PageHeader
        title={t('Categories')}
        subtitle={t('Hidden categories disappear from the store menus and can’t get new products.')}
      />

      {missingDefaults.length > 0 && (
        <Alert variant={categories.length ? 'info' : 'warning'} title={categories.length ? t('Some default categories are missing') : t('No categories yet')}>
          <p>{t('Add the standard categories: {list}.', { list: missingDefaults.map((d) => t(d.label)).join(', ') })}</p>
          <Button size="sm" className="mt-2" onClick={addDefaults}>{t('Add default categories')}</Button>
        </Alert>
      )}

      <form onSubmit={handleAdd} noValidate className="grid gap-3 rounded-xl border border-cream-200 bg-white p-4 shadow-sm sm:grid-cols-[4rem_1fr_1fr_6rem_auto] sm:items-end">
        <Input label={t('Emoji')} value={form.emoji} maxLength={8} error={errors.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
        <Input
          label={t('New category name')}
          value={form.label}
          maxLength={40}
          error={errors.label}
          onChange={(e) => {
            const label = e.target.value
            setForm((f) => ({ ...f, label, slug: slugTouched ? f.slug : slugify(label) }))
          }}
        />
        <Input
          label={t('ID (used in links)')}
          value={form.slug}
          maxLength={40}
          error={errors.slug}
          onChange={(e) => {
            setSlugTouched(true)
            setForm((f) => ({ ...f, slug: e.target.value }))
          }}
        />
        <Input label={t('Order')} inputMode="numeric" value={form.sortOrder} error={errors.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
        <Button type="submit" disabled={adding}>{adding ? t('Adding…') : t('Add')}</Button>
      </form>

      {error ? (
        <Alert variant="error">{getFriendlyErrorMessage(error)}</Alert>
      ) : loading ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
          {categories.map((category) => (
            <CategoryRow key={`${category.value}-${category.updatedAt?.seconds ?? ''}-${category.isActive}`} category={category} onDelete={setToDelete} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={toDelete ? t('Delete “{name}”?', { name: toDelete.label }) : ''}
        message={t('Only categories with no products can be deleted. To keep a category but stop using it, switch it to Hidden.')}
        confirmLabel={t('Delete')}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
