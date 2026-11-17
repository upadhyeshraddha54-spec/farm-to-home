/** Marks fictional demo listings so nobody mistakes them for real offers. */
export default function DemoBadge({ className = '' }) {
  return (
    <span
      title="Demo listing: fictional farm, illustrative price"
      className={`inline-flex items-center rounded bg-gray-900/75 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase ${className}`}
    >
      Demo
    </span>
  )
}
