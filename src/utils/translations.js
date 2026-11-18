import { LANGUAGES, t } from '../i18n'

// Languages a farmer/admin can add their own text in (English is the main field).
// NOTE: the shape is validated in firestore.rules (isValidTranslations).
// Labels are each language's own name (हिंदी, मराठी), as in the language menu.
export const CONTENT_LANGUAGES = Object.freeze(
  LANGUAGES.filter((l) => l.code !== 'en').map(({ code, label }) => ({ code, label })),
)

/** Form values for an item's translations: { hi: { field: '' }, mr: { … } }. */
export function translationsToForm(item, fields) {
  const result = {}
  CONTENT_LANGUAGES.forEach(({ code }) => {
    result[code] = {}
    fields.forEach((field) => {
      const value = item?.translations?.[code]?.[field]
      result[code][field] = typeof value === 'string' ? value : ''
    })
  })
  return result
}

/** Trimmed translations ready to save (empty strings mean "not translated"). */
export function cleanTranslations(values, fields) {
  const result = {}
  CONTENT_LANGUAGES.forEach(({ code }) => {
    result[code] = {}
    fields.forEach((field) => {
      result[code][field] = String(values?.[code]?.[field] ?? '').trim()
    })
  })
  return result
}

/** Returns an error message if any translated field is longer than `limits[field]`. */
export function validateTranslations(values, limits) {
  for (const { code } of CONTENT_LANGUAGES) {
    for (const [field, max] of Object.entries(limits)) {
      if (String(values?.[code]?.[field] ?? '').trim().length > max) {
        return t('Translations must be {count} characters or fewer.', { count: max })
      }
    }
  }
  return ''
}
