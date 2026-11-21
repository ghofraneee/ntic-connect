export const USER_ROLES = [
  'stagiaire',
  'formateur',
  'direction',
  'club',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  filiere?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  stagiaire: 'Stagiaire',
  formateur: 'Formateur',
  direction: 'Direction',
  club: 'Responsable de club',
}

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  stagiaire: '/app/stagiaire',
  formateur: '/app/formateur',
  direction: '/app/direction',
  club: '/app/club',
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    USER_ROLES.some((role) => role === value)
  )
}
