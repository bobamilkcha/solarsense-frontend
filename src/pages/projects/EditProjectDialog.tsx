import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../api/errors'
import type { Project } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextArea } from '../../components/ui/TextArea'
import { TextField } from '../../components/ui/TextField'
import { useUpdateProject } from '../../hooks/useProjects'

function EditProjectForm({ project, onDone }: { project: Project; onDone: () => void }) {
  const mutation = useUpdateProject(project.id)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name: name.trim(), description: description.trim() || null }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {mutation.isError && <Alert tone="error">{getErrorMessage(mutation.error)}</Alert>}
      <TextField
        label="Project name"
        required
        maxLength={200}
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!name.trim() ? 'Project name is required.' : undefined}
      />
      <TextArea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Customer, address, notes…"
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending} disabled={!name.trim()}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

export function EditProjectDialog({ project, open, onClose }: { project: Project; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit project">
      <EditProjectForm project={project} onDone={onClose} />
    </Modal>
  )
}
