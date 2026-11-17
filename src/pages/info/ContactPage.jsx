import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import PageMeta from '../../components/common/PageMeta'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Container from '../../components/ui/Container'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { SITE } from '../../config/site'
import useAuth from '../../hooks/useAuth'
import { PATHS } from '../../routes/paths'
import { sendContactMessage } from '../../services/profileService'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { hasNoErrors, validateName } from '../../utils/validators'

function ContactForm({ profile, orderId }) {
  const [values, setValues] = useState({
    name: profile.name ?? '',
    subject: orderId ? 'Help with my order' : '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [state, setState] = useState({ status: 'idle', error: '' })

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setErrors((er) => ({ ...er, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {
      name: validateName(values.name),
      subject: values.subject.trim().length < 3 ? 'Add a short subject.' : '',
      message: values.message.trim().length < 10 ? 'Tell us a little more (at least 10 characters).' : '',
    }
    setErrors(next)
    if (!hasNoErrors(next)) return
    setState({ status: 'sending', error: '' })
    try {
      await sendContactMessage({ ...values, orderId })
      setState({ status: 'sent', error: '' })
    } catch (error) {
      setState({ status: 'idle', error: getFriendlyErrorMessage(error) })
    }
  }

  if (state.status === 'sent') {
    return (
      <Alert variant="success" title="Message sent">
        Thanks — our team will reply to {profile.email} as soon as possible.
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {orderId && <p className="text-sm text-gray-600">About order <strong>#{orderId.slice(0, 8).toUpperCase()}</strong></p>}
      <Input label="Your name" value={values.name} error={errors.name} maxLength={60} onChange={set('name')} />
      <Input label="Subject" value={values.subject} error={errors.subject} maxLength={120} onChange={set('subject')} />
      <Textarea label="Message" value={values.message} error={errors.message} maxLength={2000} rows={6} onChange={set('message')} />
      <p className="text-xs text-gray-500">We’ll reply to {profile.email}.</p>
      <Button type="submit" disabled={state.status === 'sending'}>
        {state.status === 'sending' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}

export default function ContactPage() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  const orderId = (params.get('order') ?? '').slice(0, 40)
  const hasDetails = SITE.supportEmail || SITE.supportPhone || SITE.address

  return (
    <Container className="max-w-3xl py-8">
      <PageMeta title="Contact us" description="Get help with an order or ask us anything." />
      <Breadcrumbs items={[{ label: 'Home', to: PATHS.HOME }, { label: 'Contact us' }]} />
      <h1 className="text-3xl font-bold text-gray-900">Contact us</h1>
      <p className="mt-2 text-gray-600">Questions about an order, selling with us or anything else? Send us a message.</p>

      <div className={`mt-6 grid gap-6 ${hasDetails ? 'md:grid-cols-[1fr_16rem]' : ''}`}>
        <section className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          {loading ? null : user && profile ? (
            <ContactForm profile={profile} orderId={orderId} />
          ) : (
            <div>
              <p className="text-gray-700">Please sign in so we can link your message to your account and reply to you.</p>
              <div className="mt-4 flex gap-3">
                <Button to={PATHS.LOGIN} state={{ from: location }}>Sign in</Button>
                <Button to={PATHS.SIGNUP} variant="outline" state={{ from: location }}>Create account</Button>
              </div>
            </div>
          )}
        </section>

        {hasDetails && (
          <aside className="space-y-3 rounded-2xl border border-cream-200 bg-white p-6 text-sm shadow-sm">
            <h2 className="font-semibold text-gray-900">Other ways to reach us</h2>
            {SITE.supportEmail && <p>Email: <a className="text-brand-700 underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></p>}
            {SITE.supportPhone && <p>Phone: <a className="text-brand-700 underline" href={`tel:${SITE.supportPhone.replace(/\s/g, '')}`}>{SITE.supportPhone}</a></p>}
            {SITE.address && <p className="whitespace-pre-line text-gray-700">{SITE.legalName && <>{SITE.legalName}<br /></>}{SITE.address}</p>}
            {SITE.grievanceOfficer && <p className="text-gray-700">Grievance officer: {SITE.grievanceOfficer}</p>}
          </aside>
        )}
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Looking for policies? See <Link to={PATHS.SHIPPING} className="text-brand-700 underline">shipping</Link>,{' '}
        <Link to={PATHS.CANCELLATION} className="text-brand-700 underline">cancellations</Link> and{' '}
        <Link to={PATHS.RETURNS} className="text-brand-700 underline">returns & refunds</Link>.
      </p>
    </Container>
  )
}
