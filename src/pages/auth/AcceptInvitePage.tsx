import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { lookupInvitation } from '../../api/auth'
import { getErrorMessage, getErrorStatus } from '../../api/errors'
import { ROLE_LABELS } from '../../auth/roles'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/States'
import { TextField } from '../../components/ui/TextField'
import { useAcceptInvitation } from '../../hooks/useAuth'

const MIN_PASSWORD_LENGTH = 8

function invalidInviteMessage(error: unknown): string {
  return getErrorStatus(error) === 400
    ? 'This invite link is invalid, has expired, or has already been used. Ask your admin for a new one.'
    : getErrorMessage(error)
}

export function AcceptInvitePage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const acceptMutation = useAcceptInvitation()
  const [form, setForm] = useState({ first_name: '', last_name: '', password: '' })

  const preview = useQuery({
    queryKey: ['invitation-preview', token],
    queryFn: () => lookupInvitation(token),
    enabled: token.length > 0,
    retry: false,
  })

  if (!token) {
    return (
      <AuthLayout title="Invite link missing">
        <Alert tone="error">This link has no invite token. Open the full link your admin shared with you.</Alert>
      </AuthLayout>
    )
  }

  if (preview.isPending) {
    return (
      <AuthLayout title="Join your team">
        <LoadingState label="Checking your invite…" />
      </AuthLayout>
    )
  }

  if (preview.isError) {
    return (
      <AuthLayout title="Invite not valid">
        <Alert tone="error">{invalidInviteMessage(preview.error)}</Alert>
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-amber-700 hover:text-amber-600">
            Go to sign in
          </Link>
        </p>
      </AuthLayout>
    )
  }

  const invite = preview.data
  const passwordOk = form.password.length >= MIN_PASSWORD_LENGTH

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!passwordOk) return
    acceptMutation.mutate(
      {
        token,
        password: form.password,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
      },
      { onSuccess: () => navigate('/projects', { replace: true }) },
    )
  }

  return (
    <AuthLayout
      title={`Join ${invite.company_name}`}
      subtitle={
        <>
          You've been invited as <strong>{ROLE_LABELS[invite.role]}</strong> ({invite.email}).
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {acceptMutation.isError && <Alert tone="error">{invalidInviteMessage(acceptMutation.error)}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="First name"
            autoComplete="given-name"
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>
        <TextField
          label="Choose a password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={form.password && !passwordOk ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
        />
        <Button type="submit" className="w-full" loading={acceptMutation.isPending} disabled={!passwordOk}>
          Accept invite
        </Button>
      </form>
    </AuthLayout>
  )
}
