import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { TextField } from './ui/TextField'

type ConfirmDeleteDialogProps = {
  open: boolean
  title: string
  /** The user must type this exactly to enable the delete button. */
  name: string
  /** What gets deleted along with it. */
  children: ReactNode
  confirmLabel: string
  pending: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

function ConfirmDeleteForm({
  name,
  children,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: Omit<ConfirmDeleteDialogProps, 'open' | 'title'>) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === name.trim()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (matches && !pending) onConfirm()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
      <Alert tone="error">This is permanent and can't be undone.</Alert>
      <TextField
        label={`Type "${name}" to confirm`}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" loading={pending} disabled={!matches}>
          {confirmLabel}
        </Button>
      </div>
    </form>
  )
}

/** Delete confirmation that makes the user type the item's name first. */
export function ConfirmDeleteDialog({ open, title, onClose, ...rest }: ConfirmDeleteDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <ConfirmDeleteForm onClose={onClose} {...rest} />
    </Modal>
  )
}
