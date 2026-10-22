import { api } from './client'
import type { Invitation, InvitationCreateRequest, InvitationCreated, User, UserUpdateRequest } from './types'

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users')
  return data
}

export async function updateUser(userId: string, body: UserUpdateRequest): Promise<User> {
  const { data } = await api.patch<User>(`/users/${encodeURIComponent(userId)}`, body)
  return data
}

export async function listInvitations(): Promise<Invitation[]> {
  const { data } = await api.get<Invitation[]>('/users/invitations')
  return data
}

export async function createInvitation(body: InvitationCreateRequest): Promise<InvitationCreated> {
  const { data } = await api.post<InvitationCreated>('/users/invitations', body)
  return data
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  await api.delete(`/users/invitations/${encodeURIComponent(invitationId)}`)
}
