import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { ROLE_HOME_PATHS, ROLE_LABELS, type UserRole } from './roles'

type ProtectedRouteProps = {
  role: UserRole
  children: ReactNode
}

export default function ProtectedRoute({
  role,
  children,
}: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (user === null) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  if (user.role !== role) {
    return (
      <main className="app-public-gate">
        <p className="app-eyebrow">Espace privé</p>
        <h1>Accès refusé</h1>
        <p>
          Cette page est réservée à un autre rôle. Vous êtes connecté·e en tant
          que {ROLE_LABELS[user.role]}.
        </p>
        <Link className="app-primary-link" to={ROLE_HOME_PATHS[user.role]}>
          Revenir à mon espace
        </Link>
      </main>
    )
  }

  return children
}
