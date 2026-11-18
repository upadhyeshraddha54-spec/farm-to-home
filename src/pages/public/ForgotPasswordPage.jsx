import { useState } from 'react'
import { Link } from 'react-router'
import AuthCard from '../../components/auth/AuthCard'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { PATHS } from '../../routes/paths'
import { resetPassword } from '../../services/authService'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { validateEmail } from '../../utils/validators'
import { t, tx } from '../../i18n'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const error = validateEmail(email)
    setEmailError(error)
    if (error) return

    setSubmitting(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      // Don't reveal whether an account exists for this email.
      if (err?.code === 'auth/user-not-found') {
        setSent(true)
      } else {
        setFormError(getFriendlyErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title={t('Reset your password')}
      subtitle={t('We’ll email you a link to choose a new password.')}
      footer={
        <Link to={PATHS.LOGIN} className="font-semibold text-brand-700 hover:underline">
          {t('Back to sign in')}
        </Link>
      }
    >
      {sent ? (
        <Alert variant="success" title={t('Check your inbox')}>
          {tx('If an account exists for {email}, a password reset link has been sent. It may take a few minutes, so check your spam folder too.', {
            email: <strong>{email.trim()}</strong>,
          })}
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Input
            label={t('Email')}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError('')
            }}
            error={emailError}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('Sending…') : t('Send reset link')}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
