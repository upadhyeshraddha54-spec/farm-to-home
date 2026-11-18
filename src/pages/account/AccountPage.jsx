import { useState } from 'react'
import { Link } from 'react-router'
import PageMeta from '../../components/common/PageMeta'
import FarmerStatusNotice from '../../components/farmer/FarmerStatusNotice'
import AddressFields from '../../components/order/AddressFields'
import { AddressBlock } from '../../components/order/OrderParts'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import Input from '../../components/ui/Input'
import useAuth from '../../hooks/useAuth'
import useSignOut from '../../hooks/useSignOut'
import useToast from '../../hooks/useToast'
import { PATHS } from '../../routes/paths'
import { saveMyAddress, updateMyDetails } from '../../services/profileService'
import { getRoleLabel, ROLES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDate, formatPhone } from '../../utils/formatters'
import { EMPTY_ADDRESS } from '../../utils/orders'
import { hasNoErrors, validateAddress, validateName, validatePhone } from '../../utils/validators'
import { t, tx } from '../../i18n'

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm font-medium break-words text-gray-900">{value}</dd>
    </div>
  )
}

function DetailsEditor({ profile, uid, onDone }) {
  const toast = useToast()
  const [values, setValues] = useState({ name: profile.name, phone: profile.phone ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const next = { name: validateName(values.name), phone: validatePhone(values.phone) }
    setErrors(next)
    if (!hasNoErrors(next)) return
    setSaving(true)
    try {
      await updateMyDetails(uid, values)
      toast.success(t('Your details were updated.'))
      onDone()
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 py-4">
      <Input label={t('Name')} value={values.name} error={errors.name} maxLength={60} autoComplete="name" onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
      <Input label={t('Mobile (optional)')} type="tel" value={values.phone} error={errors.phone} autoComplete="tel" onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? t('Saving…') : t('Save')}</Button>
        <Button size="sm" variant="outline" onClick={onDone} disabled={saving}>{t('Cancel')}</Button>
      </div>
    </form>
  )
}

function AddressEditor({ profile, uid, onDone }) {
  const toast = useToast()
  const [values, setValues] = useState({ ...EMPTY_ADDRESS, fullName: profile.name, phone: profile.phone ?? '', ...profile.address })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const next = validateAddress(values)
    setErrors(next)
    if (!hasNoErrors(next)) return
    setSaving(true)
    try {
      await saveMyAddress(uid, values)
      toast.success(t('Delivery address saved.'))
      onDone()
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AddressFields
        values={values}
        errors={errors}
        onChange={(name, value) => {
          setValues((v) => ({ ...v, [name]: value }))
          setErrors((e) => ({ ...e, [name]: '' }))
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? t('Saving…') : t('Save address')}</Button>
        <Button size="sm" variant="outline" onClick={onDone} disabled={saving}>{t('Cancel')}</Button>
      </div>
    </form>
  )
}

export default function AccountPage() {
  // <ProtectedRoute> guarantees `profile` is loaded here.
  const { user, profile } = useAuth()
  const { signOut, signingOut } = useSignOut()
  const [editing, setEditing] = useState(null) // 'details' | 'address' | null
  const isCustomer = profile.role === ROLES.CUSTOMER

  return (
    <Container className="max-w-2xl py-10">
      <PageMeta title={t('Your account')} noIndex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Your account')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('Hello, {name}.', { name: profile.name })}</p>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          {getRoleLabel(profile.role)}
        </span>
      </div>

      {profile.role === ROLES.FARMER && (
        <div className="mt-6">
          <FarmerStatusNotice status={profile.farmerStatus} className="mb-3" />
          <Button to={PATHS.FARMER} size="sm">{t('Open farmer dashboard')}</Button>
        </div>
      )}
      {profile.role === ROLES.ADMIN && (
        <Button to={PATHS.ADMIN} size="sm" className="mt-6">{t('Open admin dashboard')}</Button>
      )}
      {isCustomer && profile.blocked && (
        <Alert variant="error" className="mt-6" title={t('Your account can’t place orders')}>
          {tx('Please <link>contact support</link>.', {
            link: (text) => <Link to={PATHS.CONTACT} className="underline">{text}</Link>,
          })}
        </Alert>
      )}
      {isCustomer && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to={PATHS.ORDERS} className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm hover:shadow-md">
            <p className="font-semibold text-gray-900">{t('Your orders')}</p>
            <p className="text-sm text-gray-600">{t('Track, view or cancel orders')}</p>
          </Link>
          <Link to={PATHS.CART} className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm hover:shadow-md">
            <p className="font-semibold text-gray-900">{t('Your cart')}</p>
            <p className="text-sm text-gray-600">{t('Review items and check out')}</p>
          </Link>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-cream-200 bg-white px-5 shadow-sm">
        <div className="flex items-center justify-between pt-4">
          <h2 className="font-semibold text-gray-900">{t('Your details')}</h2>
          {editing !== 'details' && (
            <Button size="sm" variant="ghost" onClick={() => setEditing('details')}>{t('Edit')}</Button>
          )}
        </div>
        {editing === 'details' ? (
          <DetailsEditor profile={profile} uid={user.uid} onDone={() => setEditing(null)} />
        ) : (
          <dl className="divide-y divide-gray-100">
            <DetailRow label={t('Name')} value={profile.name} />
            <DetailRow label={t('Email')} value={profile.email} />
            <DetailRow label={t('Mobile')} value={formatPhone(profile.phone)} />
            <DetailRow label={t('Member since')} value={formatDate(profile.createdAt)} />
          </dl>
        )}
      </section>

      {isCustomer && (
        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('Saved delivery address')}</h2>
            {editing !== 'address' && (
              <Button size="sm" variant="ghost" onClick={() => setEditing('address')}>
                {profile.address ? t('Edit') : t('Add address')}
              </Button>
            )}
          </div>
          {editing === 'address' ? (
            <div className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm">
              <AddressEditor profile={profile} uid={user.uid} onDone={() => setEditing(null)} />
            </div>
          ) : profile.address ? (
            <AddressBlock address={profile.address} title={t('Default address')} />
          ) : (
            <p className="text-sm text-gray-600">{t('No saved address yet. It’s filled in for you at checkout.')}</p>
          )}
        </section>
      )}

      <Button variant="outline" className="mt-6" onClick={signOut} disabled={signingOut}>
        {signingOut ? t('Signing out…') : t('Sign out')}
      </Button>
    </Container>
  )
}
