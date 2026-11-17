/** Round badge with a farm's initials, e.g. "GG" for Godavari Green Acres. */
export default function FarmAvatar({ name = '', size = 'md' }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
  const sizes = { md: 'h-12 w-12 text-base', lg: 'h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl' }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white ${sizes[size]}`}
    >
      {initials || '🌱'}
    </span>
  )
}
