import { useState } from 'react'
import PageHeader from '../../components/farmer/PageHeader'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import Textarea from '../../components/ui/Textarea'
import useFarmerData from '../../hooks/useFarmerData'
import { saveFarm } from '../../services/farmService'
import { INDIAN_STATES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { hasNoErrors } from '../../utils/validators'

// These limits are also enforced in firestore.rules.
const DESCRIPTION_MAX = 1000
const STATE_OPTIONS = INDIAN_STATES.map((state) => ({ value: state, label: state }))

function validateFarm(values) {
  const farmName = values.farmName.trim()
  const city = values.city.trim()
  return {
    farmName:
      farmName.length < 2 || farmName.length > 80 ? 'Farm name must be 2–80 characters.' : '',
    city: city.length < 2 || city.length > 60 ? 'Enter your village, town or city.' : '',
    state: INDIAN_STATES.includes(values.state) ? '' : 'Please choose your state.',
    description:
      values.description.trim().length > DESCRIPTION_MAX
        ? `About must be ${DESCRIPTION_MAX} characters or fewer.`
        : '',
  }
}

function FarmForm({ farm, uid, canSell, productCount }) {
  const [values, setValues] = useState({
    farmName: farm?.farmName ?? '',
    city: farm?.city ?? '',
    state: farm?.state ?? '',
    description: farm?.description ?? '',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setStatus({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFarm(values)
    setErrors(nextErrors)
    if (!hasNoErrors(nextErrors)) return

    setSaving(true)
    setStatus({ type: '', message: '' })
    try {
      await saveFarm(uid, values, {
        isNew: !farm,
        // Keep the farm name/location on existing products up to date.
        syncProducts: canSell && productCount > 0,
      })
      setStatus({ type: 'success', message: 'Farm profile saved.' })
    } catch (error) {
      setStatus({ type: 'error', message: getFriendlyErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {status.message && <Alert variant={status.type}>{status.message}</Alert>}

      <Input
        label="Farm name"
        name="farmName"
        placeholder="e.g. Green Valley Organic Farm"
        maxLength={80}
        value={values.farmName}
        onChange={handleChange}
        error={errors.farmName}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Village / town / city"
          name="city"
          maxLength={60}
          value={values.city}
          onChange={handleChange}
          error={errors.city}
        />
        <Select
          label="State"
          name="state"
          placeholder="Select your state"
          options={STATE_OPTIONS}
          value={values.state}
          onChange={handleChange}
          error={errors.state}
        />
      </div>
      <Textarea
        label="About your farm (optional)"
        name="description"
        placeholder="What you grow, how you farm, how long you’ve been farming…"
        maxLength={DESCRIPTION_MAX}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : farm ? 'Save changes' : 'Create farm profile'}
        </Button>
      </div>
    </form>
  )
}

export default function FarmProfilePage() {
  const { uid, farm, farmLoading, farmError, canSell, products } = useFarmerData()

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Farm profile"
        subtitle="Customers see this information on your products."
      />
      {farmError ? (
        <Alert variant="error">{getFriendlyErrorMessage(farmError)}</Alert>
      ) : farmLoading ? (
        <Spinner fullPage />
      ) : (
        <FarmForm
          farm={farm}
          uid={uid}
          canSell={canSell}
          productCount={products.length}
        />
      )}
    </div>
  )
}
