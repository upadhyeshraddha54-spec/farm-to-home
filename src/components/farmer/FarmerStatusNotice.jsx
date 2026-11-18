import { isFarmerSuspended } from '../../utils/constants'
import Alert from '../ui/Alert'
import { t } from '../../i18n'

/**
 * Shown only when a farmer's account is suspended. Active farmers (the
 * default) see nothing. Updates live, because the profile is a live subscription.
 */
export default function FarmerStatusNotice({ status, className = '' }) {
  if (!isFarmerSuspended(status)) return null
  return (
    <Alert variant="error" title={t('Your seller account is suspended')} className={className}>
      {t('Your products are hidden from the store and you can’t add or edit products. You can still fulfil or cancel existing orders. Please contact support if you think this is a mistake.')}
    </Alert>
  )
}
