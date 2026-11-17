import { useRouteError } from 'react-router'
import Logo from '../../components/common/Logo'
import Button from '../../components/ui/Button'
import { PATHS } from '../../routes/paths'

/**
 * Shown when something crashes while rendering a page,
 * instead of leaving the user with a blank white screen.
 */
export default function ErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream-100 px-4 text-center">
      <Logo />
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="max-w-md text-gray-600">
        An unexpected error occurred. Please try again, or go back to the home page.
      </p>
      <Button to={PATHS.HOME} reloadDocument>
        Back to home
      </Button>
    </div>
  )
}
