import { useState } from 'react'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumn,
  ClipboardList,
  FilePlus2,
  FolderKanban,
  GraduationCap,
  House,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import {
  ROLE_HOME_PATHS,
  ROLE_LABELS,
  USER_ROLES,
  type UserRole,
} from '../../auth/roles'
import { DEMO_ACCOUNTS } from '../../auth/demoAccounts'
import { useToast } from '../../components/app/useToast'
import { useData } from '../../data/useData'
import './AppLayout.css'

type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  stagiaire: [
    { label: 'Tableau de bord', path: '', icon: House },
    { label: 'Annonces', path: 'annonces', icon: Megaphone },
    { label: 'Bibliothèque numérique', path: 'bibliotheque', icon: BookOpen },
    {
      label: 'Demandes administratives',
      path: 'demandes',
      icon: ClipboardList,
    },
    { label: 'Emploi du temps', path: 'emploi-du-temps', icon: CalendarDays },
    { label: 'Clubs', path: 'clubs', icon: Users },
    { label: 'Opportunités', path: 'opportunites', icon: FolderKanban },
    { label: 'Profil', path: 'profil', icon: Settings },
  ],
  formateur: [
    { label: 'Tableau de bord', path: '', icon: House },
    { label: 'Mes cours', path: 'cours', icon: BookOpen },
    { label: 'Déposer un cours', path: 'deposer-un-cours', icon: FilePlus2 },
    { label: 'Annonces', path: 'annonces', icon: Megaphone },
    { label: 'Profil', path: 'profil', icon: Settings },
  ],
  direction: [
    { label: 'Tableau de bord', path: '', icon: House },
    { label: 'Demandes', path: 'demandes', icon: ClipboardList },
    { label: 'Annonces', path: 'annonces', icon: Megaphone },
    { label: 'Utilisateurs', path: 'utilisateurs', icon: Users },
    {
      label: 'Filières et sections',
      path: 'filieres',
      icon: GraduationCap,
    },
    { label: 'Activités', path: 'activites', icon: CalendarDays },
    { label: 'Rapports', path: 'rapports', icon: ChartNoAxesColumn },
  ],
  club: [
    { label: 'Tableau de bord', path: '', icon: House },
    { label: 'Événements', path: 'evenements', icon: CalendarDays },
    { label: 'Participants', path: 'participants', icon: Users },
    { label: 'Membres', path: 'membres', icon: GraduationCap },
  ],
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { getNotificationsFor, markNotificationRead } = useData()
  if (user === null) return null

  const notifications = getNotificationsFor(user)
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length

  return (
    <div className="app-header__popover-anchor">
      <button
        className="app-icon-button app-notification-button"
        type="button"
        aria-label={`Notifications, ${unreadCount} non lue${unreadCount === 1 ? '' : 's'}`}
        aria-expanded={open}
        aria-controls="app-notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="app-notification-count" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section
          className="app-popover app-notifications"
          id="app-notifications"
          aria-label="Notifications"
        >
          <h2>
            Notifications
            <span>{unreadCount} non lue{unreadCount === 1 ? '' : 's'}</span>
          </h2>
          {notifications.length === 0 ? (
            <p>Aucune notification pour le moment.</p>
          ) : (
            <div className="app-notifications__list">
              {notifications.slice(0, 8).map((notification) => {
                const content = (
                  <>
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <time dateTime={notification.createdAt}>
                      {new Intl.DateTimeFormat('fr-MA', {
                        day: 'numeric',
                        month: 'short',
                      }).format(new Date(notification.createdAt))}
                    </time>
                  </>
                )
                const className = `app-notification-item${notification.read ? '' : ' app-notification-item--unread'}`
                const markRead = () =>
                  markNotificationRead(notification.id, user.id)

                return notification.href ? (
                  <Link
                    className={className}
                    key={notification.id}
                    to={notification.href}
                    onClick={markRead}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    className={className}
                    key={notification.id}
                    type="button"
                    onClick={markRead}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function DemoModeMenu() {
  const [open, setOpen] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const { resetData } = useData()
  const navigate = useNavigate()

  const switchRole = (role: UserRole) => {
    login(DEMO_ACCOUNTS[role].user)
    setOpen(false)
    navigate(ROLE_HOME_PATHS[role], { replace: true })
    showToast(`Mode démo : ${ROLE_LABELS[role]}.`, 'success')
  }

  const resetDemo = () => {
    resetData()
    setOpen(false)
    showToast('Les données de démonstration ont été réinitialisées.', 'success')
  }

  return (
    <div className="app-header__popover-anchor">
      <button
        className="app-demo-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="app-demo-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Shield size={15} aria-hidden="true" />
        Mode démo
      </button>
      {open && (
        <div className="app-popover app-demo-menu" id="app-demo-menu" role="menu">
          <p>Changer de session</p>
          {USER_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              role="menuitem"
              onClick={() => switchRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
          <button
            className="app-demo-menu__reset"
            type="button"
            role="menuitem"
            onClick={resetDemo}
          >
            Réinitialiser la démo
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (user === null) return <Navigate to="/login" replace />

  const basePath = ROLE_HOME_PATHS[user.role]

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
    showToast('Vous êtes déconnecté·e.', 'info')
  }

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <button
          className="app-sidebar-backdrop"
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`app-sidebar${sidebarOpen ? ' app-sidebar--open' : ''}`}
        aria-label="Navigation de l’espace privé"
      >
        <div className="app-sidebar__top">
          <Link className="app-sidebar__brand" to="/">
            <span>NTIC</span>
            <strong>Connect</strong>
          </Link>
          <p>OFPPT · NTIC Safi</p>
          <button
            className="app-sidebar__close"
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <p className="app-sidebar__section-label">Espace de travail</p>
        <nav className="app-sidebar__nav">
          {navigationByRole[user.role].map(({ label, path, icon: Icon }) => {
            const target = path ? `${basePath}/${path}` : basePath
            return (
              <NavLink
                key={path || 'home'}
                to={target}
                end={!path}
                className={({ isActive }) =>
                  `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="app-sidebar__bottom">
          <span className="app-role-badge app-role-badge--sidebar">
            {ROLE_LABELS[user.role]}
          </span>
          <Link to="/" className="app-sidebar__public-link">
            Retour au site public
          </Link>
        </div>
      </aside>

      <div className="app-layout__main">
        <header className="app-header">
          <div className="app-header__identity">
            <button
              className="app-icon-button app-menu-toggle"
              type="button"
              aria-label="Ouvrir le menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="app-header__greeting">Espace privé</p>
              <strong>{user.name}</strong>
            </div>
            <span className="app-role-badge">{ROLE_LABELS[user.role]}</span>
          </div>

          <div className="app-header__actions">
            <NotificationBell />
            <DemoModeMenu />
            <button
              className="app-logout-button"
              type="button"
              onClick={signOut}
            >
              <LogOut size={17} aria-hidden="true" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </header>

        <main className="app-layout__content" id="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
