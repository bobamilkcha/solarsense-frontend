import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { AcceptInvitePage } from '../pages/auth/AcceptInvitePage'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectDetailPage } from '../pages/projects/ProjectDetailPage'
import { ProjectsPage } from '../pages/projects/ProjectsPage'
import { BenchmarkTab } from '../pages/sites/benchmark/BenchmarkTab'
import { BillsTab } from '../pages/sites/bills/BillsTab'
import { HistoryTab } from '../pages/sites/history/HistoryTab'
import { LiveDataTab } from '../pages/sites/live/LiveDataTab'
import { OverviewTab } from '../pages/sites/OverviewTab'
import { VisitDetailPage } from '../pages/sites/visits/VisitDetailPage'
import { VisitsTab } from '../pages/sites/visits/VisitsTab'
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
              { path: 'bills', element: <BillsTab /> },
              { path: 'benchmark', element: <BenchmarkTab /> },
              { path: 'visits', element: <VisitsTab /> },
              { path: 'visits/:visitId', element: <VisitDetailPage /> },
            ],
          },
          { path: '/team', element: <TeamPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
