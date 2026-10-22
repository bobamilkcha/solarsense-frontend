import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/States'

/** Placeholder until phase 2 (projects list and CRUD). */
export function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" description="Your company's solar assessment projects." />
      <EmptyState title="Projects are coming next" description="The projects list is built in phase 2." />
    </>
  )
}
