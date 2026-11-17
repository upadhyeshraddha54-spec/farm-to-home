/** − [ 3 ] + control. Calls onChange with a whole number between min and max. */
export default function QuantityStepper({ value, min = 1, max, onChange, label = 'Quantity', disabled = false }) {
  const clamp = (n) => Math.max(min, Math.min(max, n))

  return (
    <div className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        className="h-full w-10 rounded-l-lg text-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10)
          if (Number.isFinite(n)) onChange(clamp(n))
        }}
        aria-label={label}
        className="h-full w-12 border-x border-gray-300 text-center text-sm font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        className="h-full w-10 rounded-r-lg text-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
