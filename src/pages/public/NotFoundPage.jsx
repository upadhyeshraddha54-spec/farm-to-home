import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import { PATHS } from '../../routes/paths'
import { t } from '../../i18n'

export default function NotFoundPage() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('Page not found')}</h1>
      <p className="mt-2 max-w-md text-gray-600">
        {t('The page you’re looking for doesn’t exist or may have been moved.')}
      </p>
      <Button to={PATHS.HOME} className="mt-8">
        {t('Back to home')}
      </Button>
    </Container>
  )
}
