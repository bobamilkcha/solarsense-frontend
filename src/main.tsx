import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { bootstrapSession } from './auth/bootstrap'
import { session } from './auth/session'
import './index.css'
import { queryClient } from './lib/queryClient'
import { router } from './routes/router'

bootstrapSession()

// Never show one user's cached data to the next person who signs in.
session.subscribe(() => {
  if (session.get().status === 'anonymous') queryClient.clear()
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
