import { APP_NAME } from '../../utils/constants'
import { msg, t } from '../../i18n'

const DEFAULT_DESCRIPTION =
  msg('Buy fresh vegetables, fruits, grains, pulses and dairy directly from local farmers in Maharashtra.')

/**
 * Per-page <title> and meta tags. React 19 moves these into <head> automatically.
 * Use `noIndex` for private pages (cart, account, dashboards).
 */
export default function PageMeta({ title, description = t(DEFAULT_DESCRIPTION), noIndex = false }) {
  const fullTitle = title ? `${title} | ${APP_NAME}` : `${APP_NAME} — ${t('Fresh from the farm')}`
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </>
  )
}
