import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-amber-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist or you don't have access.</p>
      <Link to="/projects" className="mt-6 text-sm font-medium text-amber-700 hover:text-amber-600">
        Back to projects
      </Link>
    </div>
  )
}
