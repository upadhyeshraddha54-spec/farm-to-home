import Container from '../ui/Container'

/** Centered white card used by the login, signup and password-reset pages. */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-gray-700">{footer}</div>}
      </div>
    </Container>
  )
}
