import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { AcceptInvitePage } from '../pages/auth/AcceptInvitePage'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectDetailPage } from '../pages/projects/ProjectDetailPage'
import { ProjectsPage } from '../pages/projects/ProjectsPage'
import { HistoryTab } from '../pages/sites/history/HistoryTab'
import { LiveDataTab } from '../pages/sites/live/LiveDataTab'
import { OverviewTab } from '../pages/sites/OverviewTab'
import { SitePage } from '../pages/sites/SitePage'
import { TeamPage } from '../pages/team/TeamPage'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  // Public: invitees aren't logged in yet.
  { path: '/accept-invite', element: <AcceptInvitePage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/projects" replace /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailPage /> },
          {
            path: '/sites/:siteId',
            element: <SitePage />,
            children: [
              { index: true, element: <OverviewTab /> },
              { path: 'live', element: <LiveDataTab /> },
              { path: 'history', element: <HistoryTab /> },
            ],
          },
          { path: '/team', element: <TeamPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
