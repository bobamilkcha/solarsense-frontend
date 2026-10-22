import { api } from './client'
import type {
  AcceptInvitationRequest,
  AuthResponse,
  InvitationPreview,
  LoginRequest,
  RegisterRequest,
  User,
} from './types'

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', body)
  return data
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', body)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

export async function lookupInvitation(token: string): Promise<InvitationPreview> {
  const { data } = await api.post<InvitationPreview>('/auth/invitations/lookup', { token })
  return data
}

export async function acceptInvitation(body: AcceptInvitationRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/invitations/accept', body)
  return data
}
