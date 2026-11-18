import { useState } from 'react'
import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useAdminData from '../../hooks/useAdminData'
import useAsync from '../../hooks/useAsync'
import useToast from '../../hooks/useToast'
import { farmPath } from '../../routes/paths'
import { fetchFarmsById, setFarmerStatus } from '../../services/adminService'
import { FARMER_STATUS, getFarmerStatusLabel, getStateLabel, normalizeFarmerStatus, ROLES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDate, formatPhone } from '../../utils/formatters'
import { msg, t, tp } from '../../i18n'

const TABS = [FARMER_STATUS.ACTIVE, FARMER_STATUS.SUSPENDED]

const STATUS_STYLES = {
  active: 'bg-brand-100 text-brand-800',
  suspended: 'bg-red-100 text-red-700',
}

// Which actions make sense from each status.
const ACTIONS = {
  active: [{ to: FARMER_STATUS.SUSPENDED, label: msg('Suspend'), variant: 'outline' }],
  suspended: [{ to: FARMER_STATUS.ACTIVE, label: msg('Reinstate'), variant: 'primary' }],
}

const CONFIRM_TEXT = {
  active: msg('They can list products again. Products hidden by the suspension are listed again.'),
  suspended: msg('All their listed products are hidden from the store immediately, and they can’t add or edit products. Existing orders can still be fulfilled.'),
}

export default function AdminFarmersPage() {
  const toast = useToast()
  const { users, usersLoading, usersError } = useAdminData()
  const farms = useAsync(fetchFarmsById, 'farms')
  const [tab, setTab] = useState(FARMER_STATUS.ACTIVE)
  const [pending, setPending] = useState(null) // { farmer, to, label }
  const [busy, setBusy] = useState(false)

  const farmers = users.filter((u) => u.role === ROLES.FARMER)
  const shown = farmers.filter((f) => normalizeFarmerStatus(f.farmerStatus) === tab)

  async function apply() {
    setBusy(true)
    try {
      const changed = await setFarmerStatus(pending.farmer.id, pending.to)
      toast.success(
        (pending.to === FARMER_STATUS.SUSPENDED
          ? t('{name} is now suspended.', { name: pending.farmer.name })
          : t('{name} is now active.', { name: pending.farmer.name })) +
          (changed ? ' ' + tp(changed, '{count} product updated.', '{count} products updated.') : ''),
      )
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  return (
    <div className="max-w-5xl">
      <PageMeta title={t('Farmers')} noIndex />
      <PageHeader
        title={t('Farmers')}
        subtitle={t('Farmers can sell as soon as they sign up. Suspend a farmer to hide all their products.')}
      />

      <div className="mb-4 flex gap-2 relative overflow-x-auto pb-1" role="tablist" aria-label={t('Farmer status')}>
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              tab === item ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
            }`}
          >
            {getFarmerStatusLabel(item)}{' '}
            <span className="opacity-70">{farmers.filter((f) => normalizeFarmerStatus(f.farmerStatus) === item).length}</span>
          </button>
        ))}
      </div>

      {usersError ? (
        <LoadError error={usersError} />
      ) : usersLoading ? (
        <Spinner fullPage />
      ) : shown.length === 0 ? (
        <EmptyState title={t('No farmers here')} message={tab === FARMER_STATUS.SUSPENDED ? t('There are no suspended farmers.') : t('There are no active farmers.')} />
      ) : (
        <ul className="space-y-3">
          {shown.map((farmer) => {
            const farm = farms.data?.get(farmer.id)
            const status = normalizeFarmerStatus(farmer.farmerStatus)
            return (
              <li key={farmer.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-cream-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
                    {farmer.name}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
                      {getFarmerStatusLabel(status)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <a href={`mailto:${farmer.email}`} className="hover:underline">{farmer.email}</a>
                    {farmer.phone && ` · ${formatPhone(farmer.phone)}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {farm ? (
                      <>
                        <span className="font-medium">{farm.farmName}</span> · {farm.city}, {getStateLabel(farm.state)}{' '}
                        {status === FARMER_STATUS.ACTIVE && (
                          <Link to={farmPath(farmer.id)} className="text-brand-700 hover:underline">{t('(public page)')}</Link>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">{t('Farm profile not set up yet')}</span>
                    )}
                  </p>
                  {farm?.description && <p className="mt-1 line-clamp-2 max-w-xl text-xs text-gray-500">{farm.description}</p>}
                  <p className="mt-1 text-xs text-gray-500">{t('Joined {date}', { date: formatDate(farmer.createdAt) })}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS[status].map((action) => (
                    <Button
                      key={action.to}
                      size="sm"
                      variant={action.variant}
                      onClick={() => setPending({ farmer, to: action.to, label: action.label })}
                    >
                      {t(action.label)}
                    </Button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending
            ? pending.to === FARMER_STATUS.SUSPENDED
              ? t('Suspend {name}?', { name: pending.farmer.name })
              : t('Reinstate {name}?', { name: pending.farmer.name })
            : ''
        }
        message={pending ? t(CONFIRM_TEXT[pending.to]) : ''}
        confirmLabel={pending ? t(pending.label) : t('Confirm')}
        confirmVariant={pending?.to === FARMER_STATUS.ACTIVE ? 'primary' : 'danger'}
        busy={busy}
        onConfirm={apply}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
