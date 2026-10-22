import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextArea } from '../../components/ui/TextArea'
import { TextField } from '../../components/ui/TextField'
import { useCreateProject } from '../../hooks/useProjects'

const FORM_ID = 'create-project-form'

function CreateProjectForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const mutation = useCreateProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    mutation.mutate(
      { name: name.trim(), description: description.trim() || null },
      {
        onSuccess: (project) => {
          onDone()
          navigate(`/projects/${project.id}`)
        },
      },
    )
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" noValidate>
      {mutation.isError && <Alert tone="error">{getErrorMessage(mutation.error)}</Alert>}
      <TextField
        label="Project name"
        required
        maxLength={200}
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Tan residence, Shah Alam"
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
          Create project
        </Button>
      </div>
    </form>
  )
}

export function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New project">
      <CreateProjectForm onDone={onClose} />
    </Modal>
  )
}
