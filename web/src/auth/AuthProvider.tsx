import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './AuthContext'
import { isUserRole, type AuthUser } from './roles'

const STORAGE_KEY = 'ntic-connect:session'

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    isUserRole(candidate.role) &&
    (candidate.filiere === undefined ||
      typeof candidate.filiere === 'string')
  )
}

function readStoredUser(): AuthUser | null {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === null) return null

  try {
    const parsed: unknown = JSON.parse(stored)
    if (isAuthUser(parsed)) return parsed
  } catch (error) {
    console.error('La session NTIC Connect enregistrée est illisible.', error)
  }

  console.error('La session NTIC Connect enregistrée est invalide.')
  window.localStorage.removeItem(STORAGE_KEY)
  return null
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  const login = useCallback((nextUser: AuthUser) => {
    if (!isAuthUser(nextUser)) {
      throw new TypeError('Le profil de session est invalide.')
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, role: user?.role ?? null, login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
