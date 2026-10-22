import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '../components/ui/Button'

function describe(error: unknown): { title: string; message: string; reload: boolean } {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return { title: 'Page not found', message: "The page you're looking for doesn't exist.", reload: false }
  }
  // A failed dynamic import usually means a new version was deployed while the tab was open.
  if (error instanceof Error && /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(error.message)) {
    return { title: 'A new version is available', message: 'Reload the page to continue.', reload: true }
  }
  return { title: 'Something went wrong', message: 'An unexpected error occurred. Try reloading the page.', reload: true }
}

/** Last-resort error screen for errors thrown while rendering a route. */
export function RouteErrorPage() {
  const error = useRouteError()
  const { title, message, reload } = describe(error)
  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
      <div className="mt-6 flex gap-3">
        {reload && <Button onClick={() => window.location.reload()}>Reload</Button>}
        <Link to="/projects" className="inline-flex items-center px-4 text-sm font-medium text-amber-700 hover:text-amber-600">
          Go to projects
        </Link>
      </div>
    </div>
  )
}
