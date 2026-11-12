import { getErrorMessage } from '../../api/errors'
import type { Site } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Modal } from '../../components/ui/Modal'
import { useUpdateSite } from '../../hooks/useProjects'
import { SiteForm } from '../projects/SiteForm'

function EditSiteForm({ site, onDone }: { site: Site; onDone: () => void }) {
  const mutation = useUpdateSite(site.id)

  return (
    <SiteForm
      initial={{ name: site.name, lat: site.location_lat, lng: site.location_lng }}
      submitLabel="Save changes"
      pending={mutation.isPending}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}
      onCancel={onDone}
      onSubmit={({ name, lat, lng }) =>
        mutation.mutate({ name, location_lat: lat, location_lng: lng }, { onSuccess: onDone })
      }
      note={({ lat, lng }) =>
        (lat !== null && lat !== site.location_lat) || (lng !== null && lng !== site.location_lng) ? (
          <Alert tone="warning">
            The benchmark and feasibility report always use the current location, so this also changes their results
            for readings already collected.
          </Alert>
        ) : null
      }
    />
  )
}

export function EditSiteDialog({ site, open, onClose }: { site: Site; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit site">
      <EditSiteForm site={site} onDone={onClose} />
    </Modal>
  )
}
