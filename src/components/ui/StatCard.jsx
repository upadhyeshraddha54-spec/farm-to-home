const TONES = {
  default: 'text-gray-900',
  brand: 'text-brand-700',
  warning: 'text-amber-700',
  danger: 'text-red-600',
}

/** A number with a label — used on dashboards. */
export default function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className={`mt-2 text-2xl font-bold sm:text-3xl ${TONES[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
