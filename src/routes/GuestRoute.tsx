import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '../auth/useSession'
import { FullPageLoader } from '../components/layout/FullPageLoader'
import { redirectTarget } from './redirect'

/** Login and register pages: signed-in users skip straight into the app. */
export function GuestRoute() {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'loading') return <FullPageLoader />
  if (status === 'authenticated') return <Navigate to={redirectTarget(location.state)} replace />
  return <Outlet />
}
