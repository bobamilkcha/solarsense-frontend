import { Link, NavLink, Outlet } from 'react-router'
import { ROLE_LABELS, displayName } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { useLogout } from '../../hooks/useAuth'
import { cn } from '../../lib/cn'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'

const NAV_ITEMS = [
  { to: '/projects', label: 'Projects' },
  { to: '/team', label: 'Team' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
  )
}

export function AppLayout() {
  const user = useCurrentUser()
  const logoutMutation = useLogout()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/projects" className="flex items-center gap-2 font-semibold">
            <Logo />
            <span>SolarSense</span>
          </Link>
          <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right text-sm leading-tight sm:block">
              <div className="font-medium">{displayName(user)}</div>
              <div className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-200 hover:bg-slate-800 hover:text-white"
              loading={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
