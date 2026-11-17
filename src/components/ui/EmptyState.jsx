/** Friendly message for empty lists, with an optional action (e.g. a Button). */
export default function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-cream-300 bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {message && <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
