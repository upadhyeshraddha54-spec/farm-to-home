/** On/off toggle. Works with keyboard and screen readers (role="switch"). */
export default function Switch({ checked, onChange, label, disabled = false, srOnlyLabel = false }) {
  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={srOnlyLabel ? label : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
          checked ? 'bg-brand-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
      {!srOnlyLabel && <span className="text-sm font-medium text-gray-800">{label}</span>}
    </label>
  )
}
