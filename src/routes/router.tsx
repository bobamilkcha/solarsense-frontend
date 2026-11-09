import { createBrowserRouter, Navigate } from 'react-router'
import { FullPageLoader } from '../components/layout/FullPageLoader'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { RouteErrorPage } from './RouteErrorPage'

// Each page is its own chunk, so the first load only pulls in what it needs.
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <FullPageLoader />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', lazy: async () => ({ Component: (await import('../pages/auth/LoginPage')).LoginPage }) },
          { path: '/register', lazy: async () => ({ Component: (await import('../pages/auth/RegisterPage')).RegisterPage }) },
        ],
      },
      // Public: invitees aren't logged in yet.
      {
        path: '/accept-invite',
        lazy: async () => ({ Component: (await import('../pages/auth/AcceptInvitePage')).AcceptInvitePage }),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            lazy: async () => ({ Component: (await import('../components/layout/AppLayout')).AppLayout }),
            children: [
              { index: true, element: <Navigate to="/projects" replace /> },
              { path: '/projects', lazy: async () => ({ Component: (await import('../pages/projects/ProjectsPage')).ProjectsPage }) },
              {
                path: '/projects/:projectId',
                lazy: async () => ({ Component: (await import('../pages/projects/ProjectDetailPage')).ProjectDetailPage }),
              },
              {
                path: '/sites/:siteId',
                lazy: async () => ({ Component: (await import('../pages/sites/SitePage')).SitePage }),
                children: [
                  { index: true, lazy: async () => ({ Component: (await import('../pages/sites/OverviewTab')).OverviewTab }) },
                  { path: 'live', lazy: async () => ({ Component: (await import('../pages/sites/live/LiveDataTab')).LiveDataTab }) },
                  { path: 'history', lazy: async () => ({ Component: (await import('../pages/sites/history/HistoryTab')).HistoryTab }) },
                  { path: 'bills', lazy: async () => ({ Component: (await import('../pages/sites/bills/BillsTab')).BillsTab }) },
                  {
                    path: 'benchmark',
                    lazy: async () => ({ Component: (await import('../pages/sites/benchmark/BenchmarkTab')).BenchmarkTab }),
                  },
                  { path: 'visits', lazy: async () => ({ Component: (await import('../pages/sites/visits/VisitsTab')).VisitsTab }) },
                  {
                    path: 'visits/:visitId',
                    lazy: async () => ({ Component: (await import('../pages/sites/visits/VisitDetailPage')).VisitDetailPage }),
                  },
                  { path: 'survey', lazy: async () => ({ Component: (await import('../pages/sites/survey/SurveyTab')).SurveyTab }) },
                  { path: 'report', lazy: async () => ({ Component: (await import('../pages/sites/report/ReportTab')).ReportTab }) },
                ],
              },
              { path: '/team', lazy: async () => ({ Component: (await import('../pages/team/TeamPage')).TeamPage }) },
              { path: '*', lazy: async () => ({ Component: (await import('../pages/NotFoundPage')).NotFoundPage }) },
            ],
          },
        ],
      },
    ],
  },
])
