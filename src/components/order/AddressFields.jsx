import { INDIAN_STATES } from '../../utils/constants'
import Input from '../ui/Input'
import Select from '../ui/Select'

const STATE_OPTIONS = INDIAN_STATES.map((state) => ({ value: state, label: state }))

/** Delivery address inputs. `values`/`errors` are objects; `onChange(name, value)`. */
export default function AddressFields({ values, errors = {}, onChange }) {
  const field = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (event) => onChange(name, event.target.value),
  })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" autoComplete="name" maxLength={60} {...field('fullName')} />
      <Input label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" {...field('phone')} />
      <Input
        label="House / flat, street"
        autoComplete="address-line1"
        maxLength={120}
        className="sm:col-span-2"
        {...field('line1')}
      />
      <Input
        label="Area, colony (optional)"
        autoComplete="address-line2"
        maxLength={120}
        className="sm:col-span-2"
        {...field('line2')}
      />
      <Input label="Landmark (optional)" maxLength={80} {...field('landmark')} />
      <Input label="Town / city" autoComplete="address-level2" maxLength={60} {...field('city')} />
      <Select label="State" options={STATE_OPTIONS} autoComplete="address-level1" {...field('state')} />
      <Input label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} {...field('pincode')} />
    </div>
  )
}
