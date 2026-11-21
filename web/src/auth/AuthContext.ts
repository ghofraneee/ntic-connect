import { createContext } from 'react'
import type { AuthUser, UserRole } from './roles'

export type AuthContextValue = {
  user: AuthUser | null
  role: UserRole | null
  login: (user: AuthUser) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
