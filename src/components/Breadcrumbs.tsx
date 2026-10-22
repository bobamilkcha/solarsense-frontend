import { Fragment } from 'react'
import { Link } from 'react-router'

type Crumb = { label: string; to?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-amber-700">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-slate-700" aria-current="page">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
