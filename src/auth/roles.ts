import type { User, UserRole } from '../api/types'

const ADMIN_ROLES: UserRole[] = ['company_admin', 'super_admin']

/** Admin-only actions: create projects/sites, manage team. The backend still enforces this. */
export function isAdmin(user: Pick<User, 'role'>): boolean {
  return ADMIN_ROLES.includes(user.role)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  installer: 'Installer',
  company_admin: 'Company admin',
  super_admin: 'Super admin',
}

export function displayName(user: Pick<User, 'first_name' | 'last_name' | 'email'>): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return name || user.email
}
