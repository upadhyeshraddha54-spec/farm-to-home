import { Link } from 'react-router'
import { t } from '../../i18n'

/** "Home › Vegetables › Tomatoes". The last item is the current page (not a link). */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label={t('Breadcrumb')} className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-gray-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {isLast || !item.to ? (
                <span aria-current={isLast ? 'page' : undefined} className="line-clamp-1 text-gray-800">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-brand-700 hover:underline">
                  {item.label}
                </Link>
              )}
              {!isLast && <span aria-hidden="true">›</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
