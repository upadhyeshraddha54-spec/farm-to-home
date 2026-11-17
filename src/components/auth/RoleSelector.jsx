import { ROLES } from '../../utils/constants'

const OPTIONS = [
  {
    value: ROLES.CUSTOMER,
    title: 'I want to buy',
    text: 'Shop fresh produce from local farmers.',
  },
  {
    value: ROLES.FARMER,
    title: 'I want to sell',
    text: 'List your harvest and start selling today.',
  },
]

/** Two large radio cards for choosing Customer or Farmer at signup. */
export default function RoleSelector({ value, onChange, name = 'role' }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-gray-800">Account type</legend>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border-2 p-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand-300 ${
                checked
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-brand-300'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={onChange}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-gray-900">{option.title}</span>
              <span className="mt-1 block text-xs text-gray-600">{option.text}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
