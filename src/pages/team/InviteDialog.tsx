import { useState, type FormEvent } from 'react'
import { getErrorMessage, getErrorStatus } from '../../api/errors'
import type { InvitationCreated, InvitationCreateRequest } from '../../api/types'
import { ROLE_LABELS } from '../../auth/roles'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { useCreateInvitation } from '../../hooks/useTeam'

type InviteRole = InvitationCreateRequest['role']
const INVITE_ROLES: NonNullable<InviteRole>[] = ['installer', 'company_admin']

function inviteLink(token: string): string {
  return `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`
}

function InviteCreated({ invite, onDone }: { invite: InvitationCreated; onDone: () => void }) {
  const link = inviteLink(invite.token)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-4">
      <Alert tone="warning">
        Copy this link now and send it to <strong>{invite.email}</strong>. It’s shown only once and expires in 7
        days.
      </Alert>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          aria-label="Invite link"
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-base sm:text-xs"
        />
        <Button variant="secondary" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="flex justify-end">
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  )
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const mutation = useCreateInvitation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<NonNullable<InviteRole>>('installer')

  if (mutation.data) return <InviteCreated invite={mutation.data} onDone={onDone} />

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    mutation.mutate({ email: email.trim(), role })
  }

  const errorMessage =
    getErrorStatus(mutation.error) === 409
      ? 'Someone with this email is already on a team.'
      : getErrorMessage(mutation.error)

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {mutation.isError && <Alert tone="error">{errorMessage}</Alert>}
      <TextField label="Email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as NonNullable<InviteRole>)}>
        {INVITE_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </Select>
      <p className="text-xs text-slate-500">
        SolarSense doesn’t send emails. You’ll get a link to share with them yourself.
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending} disabled={!email.trim()}>
          Create invite link
        </Button>
      </div>
    </form>
  )
}

export function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Invite a team member">
      <InviteForm onDone={onClose} />
    </Modal>
  )
}
