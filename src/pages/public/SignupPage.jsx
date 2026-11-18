import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import AuthCard from '../../components/auth/AuthCard'
import RoleSelector from '../../components/auth/RoleSelector'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PasswordInput from '../../components/ui/PasswordInput'
import { PATHS } from '../../routes/paths'
import { signUp } from '../../services/authService'
import { PASSWORD_MIN_LENGTH, ROLES } from '../../utils/constants'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import {
  hasNoErrors,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../../utils/validators'
import { t } from '../../i18n'

const INITIAL_FORM = {
  role: ROLES.CUSTOMER,
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function validate(form) {
  return {
    name: validateName(form.name),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone),
    password: validatePassword(form.password),
    confirmPassword:
      form.confirmPassword === form.password ? '' : t('Passwords do not match.'),
  }
}

export default function SignupPage() {
  const location = useLocation()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (!hasNoErrors(nextErrors)) return

    setSubmitting(true)
    try {
      await signUp(form)
      // <GuestRoute> redirects once the new profile has loaded.
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error))
      setSubmitting(false)
    }
  }

  const isFarmer = form.role === ROLES.FARMER

  return (
    <AuthCard
      title={t('Create your account')}
      subtitle={t('Join Farm To Home in less than a minute.')}
      footer={
        <>
          {t('Already have an account?')}{' '}
          <Link
            to={PATHS.LOGIN}
            state={location.state}
            className="font-semibold text-brand-700 hover:underline"
          >
            {t('Sign in')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}

        <RoleSelector value={form.role} onChange={handleChange} />

        <Input
          label={isFarmer ? t('Your full name (as the farm owner)') : t('Full name')}
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <Input
          label={t('Email')}
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          label={t('Mobile number (optional)')}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
        />
        <PasswordInput
          label={t('Password')}
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint={t('At least {count} characters, with a letter and a number.', { count: PASSWORD_MIN_LENGTH })}
        />
        <PasswordInput
          label={t('Confirm password')}
          name="confirmPassword"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        {isFarmer && (
          <Alert variant="info">
            {t('You can start listing products as soon as you sign up — just set up your farm profile first so customers know who they’re buying from.')}
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('Creating account…') : t('Create account')}
        </Button>
      </form>
    </AuthCard>
  )
}
