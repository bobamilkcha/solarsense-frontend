import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '../auth/useSession'
import { FullPageLoader } from '../components/layout/FullPageLoader'

/** Renders child routes only for signed-in users; everyone else goes to /login. */
export function ProtectedRoute() {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'loading') return <FullPageLoader />
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
