import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Static pages included in sitemap.xml (when VITE_SITE_URL is set).
const SITEMAP_PATHS = [
  '/', '/products', '/farms', '/about', '/contact', '/shipping-policy',
  '/cancellation-policy', '/returns-and-refunds', '/privacy-policy', '/terms',
]

// Private areas search engines shouldn't crawl.
const DISALLOW = ['/account', '/cart', '/checkout', '/orders', '/farmer', '/admin', '/login', '/signup', '/forgot-password']

/** Writes robots.txt (and sitemap.xml if the site URL is known) at build time. */
function seoFiles(siteUrl) {
  return {
    name: 'farm-to-home-seo-files',
    generateBundle() {
      const lines = ['User-agent: *', ...DISALLOW.map((p) => `Disallow: ${p}`)]
      if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${lines.join('\n')}\n` })
      if (siteUrl) {
        const urls = SITEMAP_PATHS.map((p) => `  <url><loc>${siteUrl}${p === '/' ? '' : p}</loc></url>`)
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL ?? '').replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss(), seoFiles(siteUrl)],
    build: {
      // The Firestore SDK is one ~500 kB library (≈150 kB gzipped) that can't
      // be split further; everything else is far smaller.
      chunkSizeWarningLimit: 550,
      rolldownOptions: {
        output: {
          // Big libraries in their own long-cached files, so an app update
          // only re-downloads the (small) app code.
          codeSplitting: {
            groups: [
              { name: 'firebase-firestore', test: /node_modules[\\/](@firebase[\\/]firestore|firebase[\\/]firestore)/, priority: 30 },
              { name: 'firebase-core', test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 20 },
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/, priority: 10 },
            ],
          },
        },
      },
    },
  }
})
