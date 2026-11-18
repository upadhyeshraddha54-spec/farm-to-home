import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import { t } from '../../i18n'

/** Error message with a working "Try again" button that re-runs the request. */
export default function LoadError({ error, onRetry, title = t('We couldn’t load this page') }) {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Alert variant="error" title={title}>
        {getFriendlyErrorMessage(error)}
      </Alert>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          {t('Try again')}
        </Button>
      )}
    </div>
  )
}
