import { useNavigate } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import { Modal } from '../../components/ui/Modal'
import { useCreateSite } from '../../hooks/useProjects'
import { SiteForm } from './SiteForm'

function AddSiteForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const navigate = useNavigate()
  const mutation = useCreateSite(projectId)

  return (
    <SiteForm
      submitLabel="Add site"
      pending={mutation.isPending}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}
      onCancel={onDone}
      onSubmit={({ name, lat, lng }) =>
        mutation.mutate(
          { name, location_lat: lat, location_lng: lng },
          {
            onSuccess: (site) => {
              onDone()
              navigate(`/sites/${site.id}`)
            },
          },
        )
      }
    />
  )
}

export function PairDeviceDialog({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add a site">
      <AddSiteForm projectId={projectId} onDone={onClose} />
    </Modal>
  )
}
