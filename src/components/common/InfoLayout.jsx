import { POLICIES_UPDATED } from '../../config/site'
import { PATHS } from '../../routes/paths'
import { formatLongDate } from '../../utils/formatters'
import Container from '../ui/Container'
import Breadcrumbs from './Breadcrumbs'
import PageMeta from './PageMeta'
import { getLanguage, t } from '../../i18n'

/** Readable layout for About and policy pages. */
export default function InfoLayout({ title, description, showUpdated = true, children }) {
  return (
    <Container className="max-w-3xl py-8">
      <PageMeta title={title} description={description} />
      <Breadcrumbs items={[{ label: t('Home'), to: PATHS.HOME }, { label: title }]} />
      <article className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {showUpdated && <p className="mt-2 text-sm text-gray-500">{t('Last updated: {date}', { date: formatLongDate(POLICIES_UPDATED) })}</p>}
        {showUpdated && getLanguage() !== 'en' && (
          <p className="mt-3 rounded-lg bg-cream-100 px-3 py-2 text-xs text-gray-600">
            {t('This page is a translation for your convenience. If it differs from the English version, the English version applies.')}
          </p>
        )}
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-gray-700 [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
      </article>
    </Container>
  )
}
