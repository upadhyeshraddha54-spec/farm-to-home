import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import AuthCard from '../../components/auth/AuthCard'
import AccountProblem from '../../components/common/AccountProblem'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PasswordInput from '../../components/ui/PasswordInput'
import useAuth from '../../hooks/useAuth'
import { PATHS } from '../../routes/paths'
import { signIn } from '../../services/authService'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { hasNoErrors, validateEmail } from '../../utils/validators'
import { t } from '../../i18n'

export default function LoginPage() {
  const location = useLocation()
  const { user, profile, profileError, loading } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Signed in, but the profile couldn't be loaded. (A successful login with
  // a profile is redirected automatically by <GuestRoute>.)
  if (user && !loading && !profile) {
    return <AccountProblem error={profileError} />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const nextErrors = {
      email: validateEmail(form.email),
      password: form.password ? '' : t('Please enter your password.'),
    }
    setErrors(nextErrors)
    if (!hasNoErrors(nextErrors)) return

    setSubmitting(true)
    try {
      await signIn(form.email, form.password)
      // <GuestRoute> redirects once the profile has loaded.
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title={t('Sign in')}
      subtitle={t('Welcome back to Farm To Home.')}
      footer={
        <>
          {t('New to Farm To Home?')}{' '}
          <Link
            to={PATHS.SIGNUP}
            state={location.state}
            className="font-semibold text-brand-700 hover:underline"
          >
            {t('Create an account')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}

        <Input
          label={t('Email')}
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <PasswordInput
          label={t('Password')}
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="flex justify-end">
          <Link
            to={PATHS.FORGOT_PASSWORD}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            {t('Forgot password?')}
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('Signing in…') : t('Sign in')}
        </Button>
      </form>
    </AuthCard>
  )
}
