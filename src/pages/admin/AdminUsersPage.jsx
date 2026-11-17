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
import { FARMER_STATUS_LABELS, normalizeFarmerStatus, ROLE_LABELS, ROLES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDate, formatPhone } from '../../utils/formatters'

const ROLE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: ROLES.CUSTOMER, label: 'Customers' },
  { value: ROLES.FARMER, label: 'Farmers' },
  { value: ROLES.ADMIN, label: 'Admins' },
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
      toast.success(`${target.name} is now ${target.blocked ? 'unblocked' : 'blocked'}.`)
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setBusy(false)
      setTarget(null)
    }
  }

  return (
    <div className="max-w-5xl">
      <PageMeta title="Users" noIndex />
      <PageHeader
        title="Users"
        subtitle="Admin accounts are added with the admin:grant script described in the README — never from the website."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="user-search" className="sr-only">Search users</label>
        <input
          id="user-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or phone"
          className="h-10 w-full max-w-xs rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
        <div className="flex gap-1" role="group" aria-label="Filter by role">
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
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {usersError ? (
        <LoadError error={usersError} />
      ) : usersLoading ? (
        <Spinner fullPage />
      ) : shown.length === 0 ? (
        <EmptyState title="No users found" message="Try a different search or filter." />
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-cream-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-cream-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Name</th>
                <th scope="col" className="px-4 py-2 font-medium">Contact</th>
                <th scope="col" className="px-4 py-2 font-medium">Role</th>
                <th scope="col" className="px-4 py-2 font-medium">Joined</th>
                <th scope="col" className="px-4 py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {u.name}
                    {u.blocked && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Blocked</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    <a href={`mailto:${u.email}`} className="hover:underline">{u.email}</a>
                    {u.phone && <span className="block text-xs">{formatPhone(u.phone)}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {ROLE_LABELS[u.role] ?? u.role}
                    {u.role === ROLES.FARMER && (
                      <span className="block text-xs text-gray-500">{FARMER_STATUS_LABELS[normalizeFarmerStatus(u.farmerStatus)]}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-2 text-right">
                    {u.role === ROLES.CUSTOMER && (
                      <Button size="sm" variant="outline" onClick={() => setTarget(u)}>
                        {u.blocked ? 'Unblock' : 'Block'}
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
        title={target ? `${target.blocked ? 'Unblock' : 'Block'} ${target.name}?` : ''}
        message={
          target?.blocked
            ? 'They will be able to place orders again.'
            : 'They won’t be able to place new orders. Existing orders are not affected.'
        }
        confirmLabel={target?.blocked ? 'Unblock' : 'Block'}
        confirmVariant={target?.blocked ? 'primary' : 'danger'}
        busy={busy}
        onConfirm={toggleBlock}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
