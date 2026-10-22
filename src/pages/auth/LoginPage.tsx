import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { getErrorMessage, getErrorStatus } from '../../api/errors'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useLogin } from '../../hooks/useAuth'
import { redirectTarget } from '../../routes/redirect'

function loginErrorMessage(error: unknown): string {
  const status = getErrorStatus(error)
  if (status === 401) return 'Incorrect email or password.'
  if (status === 403) return 'This account has been deactivated. Contact your company admin.'
  return getErrorMessage(error)
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    loginMutation.mutate(
      { email: email.trim(), password },
      { onSuccess: () => navigate(redirectTarget(location.state), { replace: true }) },
    )
  }

  return (
    <AuthLayout title="Sign in to SolarSense" subtitle="Solar site assessment for installers">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {loginMutation.isError && <Alert tone="error">{loginErrorMessage(loginMutation.error)}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={loginMutation.isPending} disabled={!email || !password}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New company?{' '}
        <Link to="/register" className="font-medium text-amber-700 hover:text-amber-600">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
