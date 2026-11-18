import { useState } from 'react'
import { Link } from 'react-router'
import LoadError from '../../components/common/LoadError'
import PageMeta from '../../components/common/PageMeta'
import PageHeader from '../../components/farmer/PageHeader'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useAdminData from '../../hooks/useAdminData'
import useToast from '../../hooks/useToast'
import { adminOrderPath } from '../../routes/paths'
import { setMessageStatus } from '../../services/adminService'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { formatDateTime } from '../../utils/formatters'
import { t } from '../../i18n'

export default function AdminMessagesPage() {
  const toast = useToast()
  const { messages, messagesLoading, messagesError } = useAdminData()
  const [showResolved, setShowResolved] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const shown = messages.filter((m) => showResolved || m.status !== 'resolved')

  async function toggle(message) {
    setBusyId(message.id)
    try {
      await setMessageStatus(message.id, message.status === 'resolved' ? 'new' : 'resolved')
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-4xl">
      <PageMeta title={t('Messages')} noIndex />
      <PageHeader
        title={t('Contact messages')}
        subtitle={t('Sent from the Contact page. Reply by email.')}
        actions={
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            {t('Show resolved')}
          </label>
        }
      />
      {messagesError ? (
        <LoadError error={messagesError} />
      ) : messagesLoading ? (
        <Spinner fullPage />
      ) : shown.length === 0 ? (
        <EmptyState title={t('No messages')} message={messages.length ? t('Everything is resolved.') : t('Messages from customers and farmers will appear here.')} />
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => (
            <li key={m.id} className={`rounded-xl border bg-white p-4 shadow-sm ${m.status === 'resolved' ? 'border-gray-200 opacity-70' : 'border-cream-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{m.subject}</p>
                  <p className="text-xs text-gray-500">
                    {m.name} ·{' '}
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-brand-700 hover:underline">
                      {m.email}
                    </a>{' '}
                    · {formatDateTime(m.createdAt)}
                    {m.orderId && (
                      <>
                        {' '}· <Link to={adminOrderPath(m.orderId)} className="text-brand-700 hover:underline">{t('order')}</Link>
                      </>
                    )}
                  </p>
                </div>
                <Button size="sm" variant={m.status === 'resolved' ? 'outline' : 'primary'} onClick={() => toggle(m)} disabled={busyId === m.id}>
                  {m.status === 'resolved' ? t('Reopen') : t('Mark resolved')}
                </Button>
              </div>
              <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
