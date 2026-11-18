import { useState } from 'react'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useAdminData from '../../hooks/useAdminData'
import useToast from '../../hooks/useToast'
import { setCustomerBlocked } from '../../services/adminService'
import { getFarmerStatusLabel, getRoleLabel, ROLES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDate, formatPhone } from '../../utils/formatters'
import { msg, t } from '../../i18n'

const ROLE_FILTERS = [
  { value: 'all', label: msg('All') },
  { value: ROLES.CUSTOMER, label: msg('Customers') },
  { value: ROLES.FARMER, label: msg('Farmers') },
  { value: ROLES.ADMIN, label: msg('Admins') },
]

export default function AdminUsersPage() {
  const toast = useToast()
  const { users, usersLoading, usersError } = useAdminData()
  const [role, setRole] = useState('all')
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const term = search.trim().toLowerCase()
  const shown = users
    .filter((u) => role === 'all' || u.role === role)
    .filter(
      (u) =>
        !term ||
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.includes(term),
    )

  async function toggleBlock() {
    setBusy(true)
    try {
      await setCustomerBlocked(target.id, !target.blocked)
      toast.success(
        target.blocked
          ? t('{name} is now unblocked.', { name: target.name })
          : t('{name} is now blocked.', { name: target.name }),
      )
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setBusy(false)
      setTarget(null)
    }
  }

  return (
    <div className="max-w-5xl">
      <PageMeta title={t('Users')} noIndex />
      <PageHeader
        title={t('Users')}
        subtitle={t('Admin accounts are added with the admin:grant script described in the README — never from the website.')}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="user-search" className="sr-only">{t('Search users')}</label>
        <input
          id="user-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search name, email or phone')}
          className="h-10 w-full max-w-xs rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
        <div className="flex gap-1" role="group" aria-label={t('Filter by role')}>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={role === f.value}
              onClick={() => setRole(f.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                role === f.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      {usersError ? (
        <LoadError error={usersError} />
      ) : usersLoading ? (
        <Spinner fullPage />
      ) : shown.length === 0 ? (
        <EmptyState title={t('No users found')} message={t('Try a different search or filter.')} />
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-cream-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-cream-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">{t('Name')}</th>
                <th scope="col" className="px-4 py-2 font-medium">{t('Contact')}</th>
                <th scope="col" className="px-4 py-2 font-medium">{t('Role')}</th>
                <th scope="col" className="px-4 py-2 font-medium">{t('Joined')}</th>
                <th scope="col" className="px-4 py-2 font-medium"><span className="sr-only">{t('Actions')}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {u.name}
                    {u.blocked && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{t('Blocked')}</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    <a href={`mailto:${u.email}`} className="hover:underline">{u.email}</a>
                    {u.phone && <span className="block text-xs">{formatPhone(u.phone)}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {getRoleLabel(u.role)}
                    {u.role === ROLES.FARMER && (
                      <span className="block text-xs text-gray-500">{getFarmerStatusLabel(u.farmerStatus)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-2 text-right">
                    {u.role === ROLES.CUSTOMER && (
                      <Button size="sm" variant="outline" onClick={() => setTarget(u)}>
                        {u.blocked ? t('Unblock') : t('Block')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={
          target
            ? target.blocked
              ? t('Unblock {name}?', { name: target.name })
              : t('Block {name}?', { name: target.name })
            : ''
        }
        message={
          target?.blocked
            ? t('They will be able to place orders again.')
            : t('They won’t be able to place new orders. Existing orders are not affected.')
        }
        confirmLabel={target?.blocked ? t('Unblock') : t('Block')}
        confirmVariant={target?.blocked ? 'primary' : 'danger'}
        busy={busy}
        onConfirm={toggleBlock}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
