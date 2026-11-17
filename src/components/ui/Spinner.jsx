/** Loading spinner. Use `fullPage` while the whole screen is waiting. */
export default function Spinner({ fullPage = false, label = 'Loading…' }) {
  const spinner = (
    <div role="status" className="flex flex-col items-center gap-3">
      <span
        className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )

  if (!fullPage) return spinner

  return <div className="flex min-h-[60vh] items-center justify-center">{spinner}</div>
}
