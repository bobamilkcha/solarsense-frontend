import { useState } from 'react'
import { getErrorMessage } from '../../api/errors'
import type { Invitation, User } from '../../api/types'
import { ROLE_LABELS, displayName, isAdmin } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { useInvitations, useRevokeInvitation, useUpdateUser, useUsers } from '../../hooks/useTeam'
import { formatDate } from '../../lib/format'
import { InviteDialog } from './InviteDialog'

type EditableRole = 'installer' | 'company_admin'

function MemberRow({ member, editable }: { member: User; editable: boolean }) {
  const update = useUpdateUser()
  // super_admin is platform-wide and can't be assigned or changed from here.
  const canEdit = editable && member.role !== 'super_admin'

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
          {displayName(member)}
          {!member.is_active && <Badge tone="red">Deactivated</Badge>}
        </p>
        <p className="truncate text-sm text-slate-500">{member.email}</p>
        {update.isError && <p className="mt-1 text-xs text-red-600">{getErrorMessage(update.error)}</p>}
      </div>
      {canEdit ? (
        <div className="flex items-center gap-2">
          <Select
            label={`Role for ${displayName(member)}`}
            hideLabel
            value={member.role}
            disabled={update.isPending}
            onChange={(e) => update.mutate({ userId: member.id, body: { role: e.target.value as EditableRole } })}
          >
            <option value="installer">{ROLE_LABELS.installer}</option>
            <option value="company_admin">{ROLE_LABELS.company_admin}</option>
          </Select>
          <Button
            variant={member.is_active ? 'secondary' : 'primary'}
            size="sm"
            loading={update.isPending}
            onClick={() => {
              if (member.is_active && !window.confirm(`Deactivate ${displayName(member)}? They'll be logged out everywhere.`)) return
              update.mutate({ userId: member.id, body: { is_active: !member.is_active } })
            }}
          >
            {member.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ) : (
        <Badge tone={member.role === 'installer' ? 'neutral' : 'amber'}>{ROLE_LABELS[member.role]}</Badge>
      )}
    </li>
  )
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const revoke = useRevokeInvitation()
  return (
    <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{invitation.email}</p>
        <p className="text-sm text-slate-500">
          {ROLE_LABELS[invitation.role]} · expires {formatDate(invitation.expires_at)}
        </p>
        {revoke.isError && <p className="mt-1 text-xs text-red-600">{getErrorMessage(revoke.error)}</p>}
      </div>
      <Button variant="secondary" size="sm" loading={revoke.isPending} onClick={() => revoke.mutate(invitation.id)}>
        Revoke
      </Button>
    </li>
  )
}

const listClass = 'divide-y divide-slate-200 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200'

export function TeamPage() {
  const user = useCurrentUser()
  const admin = isAdmin(user)
  const users = useUsers()
  const invitations = useInvitations(admin)
  const [inviting, setInviting] = useState(false)

  return (
    <>
      <PageHeader
        title="Team"
        description="People in your company who can use SolarSense."
        actions={admin ? <Button onClick={() => setInviting(true)}>Invite member</Button> : null}
      />

      {users.isPending ? (
        <LoadingState label="Loading team…" />
      ) : users.isError ? (
        <ErrorState error={users.error} title="Couldn't load your team" onRetry={() => users.refetch()} />
      ) : (
        <ul className={listClass}>
          {users.data.map((member) => (
            <MemberRow key={member.id} member={member} editable={admin && member.id !== user.id} />
          ))}
        </ul>
      )}

      {admin && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Pending invites</h2>
          {invitations.isPending ? (
            <LoadingState label="Loading invites…" />
          ) : invitations.isError ? (
            <ErrorState error={invitations.error} title="Couldn't load invites" onRetry={() => invitations.refetch()} />
          ) : invitations.data.length === 0 ? (
            <EmptyState title="No pending invites" description="Invite installers so they can run site visits." />
          ) : (
            <>
              <Alert tone="info" className="mb-3">
                Invite links are shown only once, when created. To resend, revoke and invite again.
              </Alert>
              <ul className={listClass}>
                {invitations.data.map((inv) => (
                  <InvitationRow key={inv.id} invitation={inv} />
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <InviteDialog open={inviting} onClose={() => setInviting(false)} />
    </>
  )
}
