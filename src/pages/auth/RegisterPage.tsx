import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { getErrorMessage, getErrorStatus } from '../../api/errors'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useRegister } from '../../hooks/useAuth'

const MIN_PASSWORD_LENGTH = 8

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const [form, setForm] = useState({ company_name: '', first_name: '', last_name: '', email: '', password: '' })
  const [touched, setTouched] = useState(false)

  const passwordTooShort = form.password.length > 0 && form.password.length < MIN_PASSWORD_LENGTH
  const canSubmit =
    form.company_name.trim() && form.email.trim() && form.password.length >= MIN_PASSWORD_LENGTH

  function update(field: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    registerMutation.mutate(
      {
        company_name: form.company_name.trim(),
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
      },
      { onSuccess: () => navigate('/projects', { replace: true }) },
    )
  }

  const errorMessage =
    getErrorStatus(registerMutation.error) === 409
      ? 'An account with this email already exists. Try signing in instead.'
      : getErrorMessage(registerMutation.error)

  return (
    <AuthLayout title="Create your company account" subtitle="You'll be the company admin and can invite your team.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {registerMutation.isError && <Alert tone="error">{errorMessage}</Alert>}
        <TextField
          label="Company name"
          required
          autoComplete="organization"
          value={form.company_name}
          onChange={update('company_name')}
          error={touched && !form.company_name.trim() ? 'Company name is required.' : undefined}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" value={form.first_name} onChange={update('first_name')} />
          <TextField label="Last name" autoComplete="family-name" value={form.last_name} onChange={update('last_name')} />
        </div>
        <TextField
          label="Work email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={touched && !form.email.trim() ? 'Email is required.' : undefined}
        />
        <TextField
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={passwordTooShort || (touched && !form.password) ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
        />
        <Button type="submit" className="w-full" loading={registerMutation.isPending}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-amber-700 hover:text-amber-600">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
