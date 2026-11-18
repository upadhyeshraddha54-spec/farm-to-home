import { t } from '../../i18n'
import { CONTENT_LANGUAGES } from '../../utils/translations'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'

/**
 * Optional Hindi and Marathi versions of text fields (name, description…).
 * Shown to customers who choose that language; English is used when empty.
 *
 * fields: [{ name, label, multiline?, maxLength }]
 * values: { hi: { [name]: '' }, mr: { … } }
 * onChange(languageCode, fieldName, value)
 */
export default function TranslationFields({ fields, values, onChange, error, defaultOpen = false }) {
  const hasAny = CONTENT_LANGUAGES.some(({ code }) =>
    fields.some((f) => values?.[code]?.[f.name]?.trim()),
  )
  return (
    <details
      open={defaultOpen || hasAny || Boolean(error)}
      className="rounded-lg border border-cream-200 bg-cream-50 p-3"
    >
      <summary className="cursor-pointer text-sm font-medium text-gray-800">
        {t('Hindi and Marathi versions (optional)')}
      </summary>
      <p className="mt-2 text-xs text-gray-500">
        {t('Shown to customers who choose that language. Leave empty to show the English text.')}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {CONTENT_LANGUAGES.map(({ code, label }) => (
          <fieldset key={code} lang={code} className="space-y-3">
            <legend className="mb-1 text-sm font-semibold text-gray-900">{label}</legend>
            {fields.map((field) => {
              const Field = field.multiline ? Textarea : Input
              return (
                <Field
                  key={field.name}
                  label={field.label}
                  maxLength={field.maxLength}
                  value={values?.[code]?.[field.name] ?? ''}
                  onChange={(e) => onChange(code, field.name, e.target.value)}
                />
              )
            })}
          </fieldset>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </details>
  )
}
