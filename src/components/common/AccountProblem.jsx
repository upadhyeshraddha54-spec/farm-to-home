import useSignOut from '../../hooks/useSignOut'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Container from '../ui/Container'

/**
 * Shown when someone is signed in but their profile (users/{uid}) can't be
 * loaded — e.g. the security rules haven't been published yet, or the
 * profile document was deleted.
 */
export default function AccountProblem({ error }) {
  const { signOut, signingOut } = useSignOut()

  return (
    <Container className="max-w-lg py-16">
      <Alert variant="error" title="We couldn't load your account">
        <p>
          {error
            ? getFriendlyErrorMessage(error)
            : 'Your account profile was not found.'}{' '}
          Please sign out and try again. If this keeps happening, contact support.
        </p>
      </Alert>
      <Button variant="outline" className="mt-6" onClick={signOut} disabled={signingOut}>
        {signingOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </Container>
  )
}
