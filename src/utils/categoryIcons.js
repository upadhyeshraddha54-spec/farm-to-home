import { getCategoryEmoji } from './constants'

// Soft background colour per category tile (decorative). Unknown/new
// categories get a colour picked from the palette by their name.
const BACKGROUNDS = {
  vegetables: 'bg-green-100',
  fruits: 'bg-amber-100',
  'grains-pulses': 'bg-yellow-100',
  'dairy-eggs': 'bg-sky-100',
  'spices-herbs': 'bg-red-100',
  'dry-fruits-nuts': 'bg-orange-100',
  'honey-jaggery': 'bg-amber-100',
  'oils-ghee': 'bg-lime-100',
}
const PALETTE = ['bg-green-100', 'bg-amber-100', 'bg-sky-100', 'bg-rose-100', 'bg-lime-100']

export function getCategoryStyle(category = '') {
  const hash = [...category].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return {
    emoji: getCategoryEmoji(category),
    bg: BACKGROUNDS[category] ?? PALETTE[hash % PALETTE.length],
  }
}
