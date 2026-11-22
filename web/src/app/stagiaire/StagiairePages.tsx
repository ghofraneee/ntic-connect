import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  FileText,
  MapPin,
  Search,
  Send,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import type {
  AdministrativeRequest,
  Announcement,
  RequestStatus,
  RequestType,
} from '../../data/db'
import { REQUEST_STATUS_LABELS } from '../../data/db'
import { useData } from '../../data/useData'
import { useToast } from '../../components/app/useToast'
import './StagiairePages.css'

const appLoadedAt = Date.now()

const requestTypes: RequestType[] = [
  'Attestation de scolarité',
  'Information administrative',
  'Problème d’équipement',
  'Suggestion',
  'Réclamation',
]

const requestSteps: { status: RequestStatus; label: string }[] = [
  { status: 'envoyee', label: 'Envoyée' },
  { status: 'en_verification', label: 'En cours de vérification' },
  { status: 'en_traitement', label: 'En traitement' },
  { status: 'traitee', label: 'Traitée' },
  { status: 'refusee', label: 'Refusée' },
]

const opportunityItems = [
  {
    id: 'opp-001',
    kind: 'Stage',
    title: 'Stage de développement web',
    organization: 'Atelier numérique · Safi',
    filiere: 'Développement Digital',
    deadline: '2026-12-10',
    detail: 'Six semaines pour participer à la création d’un site vitrine.',
  },
  {
    id: 'opp-002',
    kind: 'Hackathon',
    title: 'Défi numérique du littoral',
    organization: 'Rencontre inter-écoles',
    filiere: 'Toutes les filières',
    deadline: '2026-12-15',
    detail: 'En équipe, imaginer un service utile aux habitants du territoire.',
  },
  {
    id: 'opp-003',
    kind: 'Concours',
    title: 'Concours de pitch de projet',
    organization: 'Entrepreneurship Club',
    filiere: 'Gestion des entreprises',
    deadline: '2027-01-08',
    detail: 'Présenter une idée en trois minutes devant un jury de formateurs.',
  },
  {
    id: 'opp-004',
    kind: 'Stage',
    title: 'Stage support informatique',
    organization: 'Service informatique · Safi',
    filiere: 'Infrastructure Digitale',
    deadline: '2027-01-12',
    detail: 'Découvrir la préparation des postes et l’assistance aux utilisateurs.',
  },
  {
    id: 'opp-005',
    kind: 'Hackathon',
    title: 'Créer pour apprendre',
    organization: 'OFPPT · édition régionale',
    filiere: 'Toutes les filières',
    deadline: '2027-01-20',
    detail: 'Un week-end pour prototyper un outil pédagogique en équipe.',
  },
] as const

function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'long',
    ...(options ?? {}),
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function targetLabel(announcement: Announcement): string {
  if (announcement.target === 'filiere') {
    return announcement.targetFiliere ?? 'Filière'
  }
  if (announcement.target === 'tous') return 'Toute la communauté'
  if (announcement.target === 'stagiaires') return 'Stagiaires'
  return 'Formateurs'
}

function usePageReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), 320)
    return () => window.clearTimeout(timeout)
  }, [])
  return ready
}

function LoadingSkeleton() {
  return (
    <div className="stg-skeleton" role="status" aria-label="Chargement">
      <span />
      <span />
      <span />
    </div>
  )
}

function PageFrame({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <section className="stg-page">
      <header className="stg-page__heading">
        <p className="app-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro && <p className="app-page__intro">{intro}</p>}
      </header>
      {children}
    </section>
  )
}

function EmptyState({
  title,
  detail,
}: {
  title: string
  detail: string
}) {
  return (
    <div className="stg-empty">
      <span aria-hidden="true">—</span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`stg-status stg-status--${status}`}>
      {REQUEST_STATUS_LABELS[status]}
    </span>
  )
}

function RequestTimeline({ request }: { request: AdministrativeRequest }) {
  const currentIndex =
    request.status === 'refusee'
      ? requestSteps.length - 1
      : requestSteps.findIndex((step) => step.status === request.status)

  return (
    <ol className="stg-timeline" aria-label="Étapes de la demande">
      {requestSteps.map((step, index) => {
        const isCurrent = step.status === request.status
        const isComplete =
          request.status === 'refusee'
            ? step.status === 'envoyee'
            : index < currentIndex
        return (
          <li
            className={`stg-timeline__step${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
            key={step.status}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="stg-timeline__marker">
              {isComplete ? <Check size={14} aria-hidden="true" /> : index + 1}
            </span>
            <span>{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function DashboardPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const {
    requests,
    events,
    clubs,
    registrations,
    getAnnouncementsFor,
    getLessonsFor,
    getNotificationsFor,
  } = useData()

  if (!ready) return <LoadingSkeleton />
  if (user === null) return null

  const myRequests = requests.filter((request) => request.ownerId === user.id)
  const activeRequests = myRequests.filter(
    (request) => request.status !== 'traitee' && request.status !== 'refusee',
  )
  const unreadNotifications = getNotificationsFor(user).filter(
    (notification) => !notification.read,
  ).length
  const myAnnouncements = getAnnouncementsFor(user)
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const myLessons = getLessonsFor(user)
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const upcomingEvents = events
    .filter((event) => new Date(event.startsAt).getTime() >= appLoadedAt)
    .slice()
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 3)

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Tableau de bord"
      title={`Bonjour ${user.name.split(' ')[0]}.`}
      intro="Les informations et les démarches utiles à votre parcours, réunies au même endroit."
    >
      <div className="stg-stat-grid">
        <div className="stg-stat">
          <span>Demandes en cours</span>
          <strong>{activeRequests.length}</strong>
          <Link to="/app/stagiaire/demandes">Suivre mes demandes <ArrowUpRight size={15} /></Link>
        </div>
        <div className="stg-stat">
          <span>Notifications non lues</span>
          <strong>{unreadNotifications}</strong>
          <span className="stg-stat__note">Mises à jour de votre espace</span>
        </div>
        <div className="stg-stat">
          <span>Activités à venir</span>
          <strong>{upcomingEvents.length}</strong>
          <Link to="/app/stagiaire/clubs">Voir le calendrier <ArrowUpRight size={15} /></Link>
        </div>
      </div>

      <div className="stg-dashboard-grid">
        <section className="stg-panel stg-dashboard-announcements">
          <div className="stg-section-heading">
            <div>
              <p className="stg-kicker">À la une</p>
              <h2>Dernières annonces</h2>
            </div>
            <Link to="/app/stagiaire/annonces" aria-label="Toutes les annonces">
              Toutes <ArrowRight size={16} />
            </Link>
          </div>
          {myAnnouncements.length === 0 ? (
            <EmptyState title="Aucune annonce" detail="Les prochaines informations apparaîtront ici." />
          ) : (
            <div className="stg-brief-list">
              {myAnnouncements.slice(0, 3).map((announcement) => (
                <article className="stg-brief" key={announcement.id}>
                  <span>{formatDate(announcement.createdAt)} · {targetLabel(announcement)}</span>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.body}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="stg-panel stg-dashboard-lessons">
          <div className="stg-section-heading">
            <div>
              <p className="stg-kicker">Ressources</p>
              <h2>Nouveaux cours</h2>
            </div>
            <Link to="/app/stagiaire/bibliotheque" aria-label="Toute la bibliothèque">
              Bibliothèque <ArrowRight size={16} />
            </Link>
          </div>
          {myLessons.length === 0 ? (
            <EmptyState title="Aucun cours disponible" detail="Les ressources de votre filière apparaîtront ici." />
          ) : (
            <ul className="stg-compact-list">
              {myLessons.slice(0, 4).map((lesson) => (
                <li key={lesson.id}>
                  <BookOpen size={17} aria-hidden="true" />
                  <span><strong>{lesson.title}</strong><small>{lesson.subject} · {lesson.trainer}</small></span>
                  <span>{formatDate(lesson.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="stg-panel stg-dashboard-requests">
          <div className="stg-section-heading">
            <div>
              <p className="stg-kicker">Démarches</p>
              <h2>Mes demandes</h2>
            </div>
            <Link to="/app/stagiaire/demandes">Tout voir <ArrowRight size={16} /></Link>
          </div>
          {myRequests.length === 0 ? (
            <EmptyState title="Pas encore de demande" detail="Une démarche administrative ? Déposez-la en ligne." />
          ) : (
            <ul className="stg-request-list">
              {myRequests.slice(0, 3).map((request) => (
                <li key={request.id}>
                  <Link to={`/app/stagiaire/demandes/${request.id}`}>
                    <span><strong>{request.type}</strong><small>{request.id} · {formatDate(request.updatedAt)}</small></span>
                    <StatusBadge status={request.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="stg-panel stg-dashboard-events">
          <div className="stg-section-heading">
            <div>
              <p className="stg-kicker">Vie de campus</p>
              <h2>Prochains rendez-vous</h2>
            </div>
            <Link to="/app/stagiaire/clubs">Les clubs <ArrowRight size={16} /></Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <EmptyState title="Aucune activité prévue" detail="Les prochains événements seront annoncés ici." />
          ) : (
            <ul className="stg-event-list">
              {upcomingEvents.map((event) => {
                const club = clubs.find((item) => item.id === event.clubId)?.name ?? 'Club'
                const count = registrations.filter((item) => item.eventId === event.id).length
                return (
                  <li key={event.id}>
                    <div className="stg-event-date">
                      <strong>{new Intl.DateTimeFormat('fr-MA', { day: '2-digit' }).format(new Date(event.startsAt))}</strong>
                      <span>{new Intl.DateTimeFormat('fr-MA', { month: 'short' }).format(new Date(event.startsAt))}</span>
                    </div>
                    <div><strong>{event.title}</strong><small>{club} · {count} inscrit·es</small></div>
                    <MapPin size={16} aria-label={event.location} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

function AnnouncementsPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { getAnnouncementsFor, markAnnouncementRead } = useData()
  const [period, setPeriod] = useState('all')
  const [target, setTarget] = useState('all')
  const [readState, setReadState] = useState('all')
  if (!ready) return <LoadingSkeleton />
  if (user === null) return null

  const visible = getAnnouncementsFor(user)
    .filter((announcement) => {
      const age = appLoadedAt - new Date(announcement.createdAt).getTime()
      const withinPeriod =
        period === 'all' ||
        (period === '7' && age <= 7 * 86400000) ||
        (period === '30' && age <= 30 * 86400000)
      const matchesTarget = target === 'all' || announcement.target === target
      const isRead = announcement.readBy.includes(user.id)
      const matchesRead =
        readState === 'all' ||
        (readState === 'read' && isRead) ||
        (readState === 'unread' && !isRead)
      return withinPeriod && matchesTarget && matchesRead
    })
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Informations"
      title="Annonces"
      intro="Les nouvelles de l’établissement, des formateurs et de votre filière."
    >
      <div className="stg-filters" aria-label="Filtres des annonces">
        <label>Afficher
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="all">Toutes les dates</option>
            <option value="7">Les 7 derniers jours</option>
            <option value="30">Les 30 derniers jours</option>
          </select>
        </label>
        <label>Public
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            <option value="all">Toutes les cibles</option>
            <option value="tous">Toute la communauté</option>
            <option value="filiere">Par filière</option>
            <option value="stagiaires">Stagiaires</option>
          </select>
        </label>
        <label>Lecture
          <select value={readState} onChange={(event) => setReadState(event.target.value)}>
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
            <option value="read">Lues</option>
          </select>
        </label>
      </div>
      <div className="stg-announcements">
        {visible.length === 0 ? (
          <EmptyState title="Aucune annonce pour ces filtres" detail="Modifiez les critères pour afficher d’autres informations." />
        ) : visible.map((announcement) => {
          const isRead = announcement.readBy.includes(user.id)
          return (
            <article className={`stg-announcement${isRead ? '' : ' is-unread'}`} key={announcement.id}>
              <div className="stg-announcement__meta">
                <time dateTime={announcement.createdAt}>{formatDate(announcement.createdAt)}</time>
                <span>{targetLabel(announcement)}</span>
                {!isRead && <span className="stg-unread-label">Non lue</span>}
              </div>
              <div>
                <h2>{announcement.title}</h2>
                <p>{announcement.body}</p>
                <small>Publié par {announcement.publishedBy}</small>
              </div>
              {!isRead && (
                <button className="stg-text-button" type="button" onClick={() => markAnnouncementRead(announcement.id, user.id)}>
                  Marquer comme lue <Check size={15} />
                </button>
              )}
            </article>
          )
        })}
      </div>
    </PageFrame>
  )
}

function LibraryPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { getLessonsFor } = useData()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [filiere, setFiliere] = useState('all')
  const [subject, setSubject] = useState('all')
  if (!ready) return <LoadingSkeleton />
  if (user === null) return null

  const lessons = getLessonsFor(user)
  const filieres = Array.from(new Set(lessons.map((lesson) => lesson.filiere))).sort()
  const subjects = Array.from(new Set(lessons.map((lesson) => lesson.subject))).sort()
  const visible = lessons.filter((lesson) => {
    const matchesText = `${lesson.title} ${lesson.subject} ${lesson.trainer}`
      .toLocaleLowerCase('fr')
      .includes(query.toLocaleLowerCase('fr'))
    return (
      matchesText &&
      (filiere === 'all' || lesson.filiere === filiere) &&
      (subject === 'all' || lesson.subject === subject)
    )
  })

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Ressources pédagogiques"
      title="Bibliothèque numérique"
      intro="Des cours et des supports classés par filière, matière et formateur."
    >
      <div className="stg-library-tools">
        <label className="stg-search">
          <Search size={18} aria-hidden="true" />
          <span className="stg-visually-hidden">Rechercher un cours</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un cours, une matière…" />
        </label>
        <label>Filière
          <select value={filiere} onChange={(event) => setFiliere(event.target.value)}>
            <option value="all">Toutes les filières</option>
            {filieres.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Matière
          <select value={subject} onChange={(event) => setSubject(event.target.value)}>
            <option value="all">Toutes les matières</option>
            {subjects.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <EmptyState title="Aucun support trouvé" detail="Essayez un autre mot-clé ou élargissez les filtres." />
      ) : (
        <div className="stg-library-grid">
          {visible.map((lesson) => (
            <article className="stg-library-item" key={lesson.id}>
              <div className="stg-library-item__icon"><FileText size={23} aria-hidden="true" /></div>
              <div className="stg-library-item__meta"><span>{lesson.format}</span><span>{lesson.fileSize}</span></div>
              <h2>{lesson.title}</h2>
              <p>{lesson.subject} · {lesson.filiere}</p>
              <small>{lesson.section} · {lesson.trainer}</small>
              <button type="button" className="stg-outline-button" onClick={() => showToast(`Téléchargement de « ${lesson.fileName} » prêt.`, 'success')}>
                <ArrowDownToLine size={16} /> Télécharger
              </button>
            </article>
          ))}
        </div>
      )}
    </PageFrame>
  )
}

function RequestsPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { requests } = useData()
  if (!ready) return <LoadingSkeleton />
  if (user === null) return null
  const myRequests = requests
    .filter((request) => request.ownerId === user.id)
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Démarches"
      title="Demandes administratives"
      intro="Déposez une demande et suivez son traitement, étape par étape."
    >
      <div className="stg-toolbar">
        <span>{myRequests.length} demande{myRequests.length === 1 ? '' : 's'} enregistrée{myRequests.length === 1 ? '' : 's'}</span>
        <Link className="stg-primary-button" to="/app/stagiaire/demandes/nouvelle">
          <Send size={16} /> Nouvelle demande
        </Link>
      </div>
      {myRequests.length === 0 ? (
        <EmptyState title="Aucune demande en cours" detail="Votre historique apparaîtra ici après l’envoi de votre première demande." />
      ) : (
        <div className="stg-request-table">
          <div className="stg-request-table__head"><span>Demande</span><span>Dernière mise à jour</span><span>Statut</span><span /></div>
          {myRequests.map((request) => (
            <Link className="stg-request-row" to={`/app/stagiaire/demandes/${request.id}`} key={request.id}>
              <span><strong>{request.type}</strong><small>{request.id}</small></span>
              <time dateTime={request.updatedAt}>{formatDate(request.updatedAt)}</time>
              <StatusBadge status={request.status} />
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </PageFrame>
  )
}

function NewRequestPage() {
  const { user } = useAuth()
  const { addRequest } = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [type, setType] = useState<RequestType>(requestTypes[0])
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  if (user === null) return null

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!details.trim()) {
      setError('Décrivez votre demande avant de l’envoyer.')
      return
    }
    try {
      const request = addRequest({ type, details }, user)
      showToast(`Votre demande ${request.id} a été envoyée à la Direction.`, 'success')
      navigate(`/app/stagiaire/demandes/${request.id}`)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'La demande n’a pas pu être envoyée.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Nouvelle démarche"
      title="Déposer une demande"
      intro="Votre demande sera transmise à la Direction. Vous pourrez suivre son évolution depuis cet espace."
    >
      <form className="stg-form stg-request-form" onSubmit={submit}>
        <label>Type de demande
          <select value={type} onChange={(event) => setType(event.target.value as RequestType)}>
            {requestTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Détails
          <textarea
            aria-required="true"
            rows={6}
            value={details}
            onChange={(event) => { setDetails(event.target.value); setError('') }}
            placeholder="Précisez le contexte et les informations utiles."
            aria-describedby={error ? 'stg-request-error' : 'stg-request-help'}
            aria-invalid={Boolean(error)}
          />
          <small id="stg-request-help">N’indiquez que les renseignements nécessaires au traitement.</small>
        </label>
        {error && <p className="stg-form-error" id="stg-request-error" role="alert">{error}</p>}
        <div className="stg-form-actions">
          <Link className="stg-secondary-button" to="/app/stagiaire/demandes">Annuler</Link>
          <button className="stg-primary-button" type="submit"><Send size={16} /> Envoyer la demande</button>
        </div>
      </form>
    </PageFrame>
  )
}

function RequestDetailPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { requests } = useData()
  const { requestId } = useParams()
  if (!ready) return <LoadingSkeleton />
  if (user === null) return null
  const request = requests.find(
    (item) => item.id === requestId && item.ownerId === user.id,
  )
  if (!request) {
    return (
      <PageFrame eyebrow="Espace stagiaire · Démarches" title="Demande introuvable">
        <EmptyState title="Cette demande n’est pas disponible" detail="Vérifiez le lien ou retournez à la liste de vos demandes." />
        <Link className="stg-secondary-button" to="/app/stagiaire/demandes"><ArrowLeft size={16} /> Mes demandes</Link>
      </PageFrame>
    )
  }

  return (
    <PageFrame
      eyebrow={`Demande ${request.id}`}
      title={request.type}
      intro={`Envoyée le ${formatDate(request.createdAt)} · Filière ${request.filiere}`}
    >
      <div className="stg-detail-toolbar">
        <Link className="stg-back-link" to="/app/stagiaire/demandes"><ArrowLeft size={16} /> Toutes mes demandes</Link>
        <StatusBadge status={request.status} />
      </div>
      <div className="stg-detail-grid">
        <section className="stg-panel">
          <p className="stg-kicker">Suivi</p>
          <h2>Étapes de traitement</h2>
          <RequestTimeline request={request} />
          {request.status === 'refusee' && request.refusalReason && (
            <div className="stg-refusal">
              <strong>Motif du refus</strong>
              <p>{request.refusalReason}</p>
            </div>
          )}
        </section>
        <section className="stg-panel">
          <p className="stg-kicker">Votre demande</p>
          <h2>Détails et historique</h2>
          <p className="stg-request-details">{request.details}</p>
          <ol className="stg-history">
            {request.history.map((entry) => (
              <li key={entry.id}>
                <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                <strong>{REQUEST_STATUS_LABELS[entry.status]}</strong>
                <span>{entry.actorName}{entry.note ? ` · ${entry.note}` : ''}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageFrame>
  )
}

function SchedulePage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { scheduleWeeks, filieres } = useData()
  const [selectedWeekId, setSelectedWeekId] = useState('')
  if (!ready) return <LoadingSkeleton />
  if (user === null) return null

  const weeks = scheduleWeeks.slice().sort(
    (left, right) => right.weekStart.localeCompare(left.weekStart),
  )
  const selectedWeek =
    weeks.find((week) => week.id === selectedWeekId) ?? weeks[0]
  const section = '1re année · Groupe A'
  const slots = selectedWeek?.slots.filter(
    (slot) =>
      slot.filiere === (user.filiere ?? 'Développement Digital') &&
      slot.section === section,
  ) ?? []
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const timeRanges = Array.from(
    new Set(slots.map((slot) => `${slot.startTime} – ${slot.endTime}`)),
  ).sort()

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Organisation"
      title="Emploi du temps"
      intro={`Une vue hebdomadaire pour ${user.filiere ?? 'Développement Digital'} · ${section}.`}
    >
      {weeks.length > 1 && (
        <label className="stg-schedule-week-picker">
          Semaine
          <select
            value={selectedWeek?.id ?? ''}
            onChange={(event) => setSelectedWeekId(event.target.value)}
          >
            {weeks.map((week) => (
              <option value={week.id} key={week.id}>{week.label}</option>
            ))}
          </select>
        </label>
      )}
      <div className="stg-schedule-note">
        <CalendarDays size={18} />
        {selectedWeek?.label ? `Semaine du ${selectedWeek.label}` : 'Aucune semaine publiée'}
      </div>
      <div className="stg-schedule-scroll" tabIndex={0} aria-label="Emploi du temps hebdomadaire">
        <table className="stg-schedule">
          <thead><tr><th>Horaire</th>{days.map((day) => <th key={day}>{day}</th>)}</tr></thead>
          <tbody>
            {timeRanges.map((range) => (
              <tr key={range}>
                <th scope="row">{range}</th>
                {days.map((day) => {
                  const item = slots.find(
                    (slot) =>
                      slot.day === day &&
                      `${slot.startTime} – ${slot.endTime}` === range,
                  )
                  return (
                    <td key={day}>
                      {item ? (
                        <span>{item.course}<small>{item.room}</small></span>
                      ) : (
                        <span className="stg-schedule__free">Temps libre</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {slots.length === 0 && (
        <EmptyState title="Aucun cours cette semaine" detail="La Direction n’a pas encore publié de créneau pour votre groupe." />
      )}
      <p className="stg-footnote">{filieres.length} filière(s) configurée(s) · Planning partagé avec la Direction.</p>
    </PageFrame>
  )
}

function ClubsPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const {
    clubs,
    events,
    registrations,
    clubJoinRequests,
    registerForEvent,
    requestClubMembership,
  } = useData()
  const { showToast } = useToast()
  if (!ready) return <LoadingSkeleton />
  if (user === null) return null

  const upcomingEvents = events
    .filter((event) => new Date(event.startsAt).getTime() >= appLoadedAt)
    .slice()
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))

  const joinClub = (clubId: string, clubName: string) => {
    try {
      const request = requestClubMembership(clubId, user)
      if (request.status === 'accepted') {
        showToast(`Vous êtes déjà membre du ${clubName}.`, 'info')
      } else {
        showToast(`Votre demande pour rejoindre le ${clubName} a été envoyée.`, 'success')
      }
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'La demande n’a pas pu être envoyée.', 'error')
    }
  }

  const register = (eventId: string, eventTitle: string) => {
    try {
      registerForEvent(eventId, user)
      showToast(`Votre inscription à « ${eventTitle} » est confirmée.`, 'success')
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'L’inscription n’a pas pu être enregistrée.', 'error')
    }
  }

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Vie de campus"
      title="Clubs et activités"
      intro="Des ateliers pour apprendre ensemble, partager un projet ou rencontrer d’autres stagiaires."
    >
      <div className="stg-club-grid">
        {clubs.map((club) => {
          const membership = clubJoinRequests.find(
            (request) => request.clubId === club.id && request.userId === user.id && request.status !== 'refused',
          )
          const clubEvents = upcomingEvents.filter((event) => event.clubId === club.id)
          return (
            <article className="stg-club" key={club.id}>
              <div className="stg-club__head">
                <span>{club.category}</span>
                <strong>{club.memberCount} membres</strong>
              </div>
              <h2>{club.name}</h2>
              <p>{club.description}</p>
              <button
                className="stg-outline-button"
                type="button"
                disabled={Boolean(membership)}
                onClick={() => joinClub(club.id, club.name)}
              >
                {membership?.status === 'accepted' ? 'Membre' : membership ? 'Demande envoyée' : 'Demander à rejoindre'}
              </button>
              <div className="stg-club__events">
                <h3>Prochains événements</h3>
                {clubEvents.length === 0 ? (
                  <p className="stg-inline-empty">Aucun rendez-vous annoncé.</p>
                ) : clubEvents.map((event) => {
                  const count = registrations.filter((item) => item.eventId === event.id).length
                  const registered = registrations.some((item) => item.eventId === event.id && item.userId === user.id)
                  const full = count >= event.capacity
                  return (
                    <div className="stg-club-event" key={event.id}>
                      <div className="stg-club-event__title">
                        <strong>{event.title}</strong>
                        <span><CalendarDays size={14} /> {formatDateTime(event.startsAt)}</span>
                        <span><MapPin size={14} /> {event.location}</span>
                        <p>{event.description}</p>
                      </div>
                      <div className="stg-club-event__action">
                        <small>{count} / {event.capacity} places</small>
                        <button
                          className={registered ? 'stg-secondary-button' : 'stg-primary-button'}
                          type="button"
                          disabled={registered || full}
                          onClick={() => register(event.id, event.title)}
                        >
                          {registered ? <><Check size={15} /> Inscrit·e</> : full ? 'Complet' : 'S’inscrire'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
    </PageFrame>
  )
}

function OpportunitiesPage() {
  const ready = usePageReady()
  const [kind, setKind] = useState('all')
  const [query, setQuery] = useState('')
  if (!ready) return <LoadingSkeleton />
  const visible = opportunityItems.filter((item) => {
    const text = `${item.title} ${item.organization} ${item.filiere}`.toLocaleLowerCase('fr')
    return (kind === 'all' || item.kind === kind) && text.includes(query.toLocaleLowerCase('fr'))
  })

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Après la formation"
      title="Opportunités"
      intro="Stages, concours et rencontres pour mettre vos compétences en pratique."
    >
      <div className="stg-opportunity-tools">
        <label className="stg-search">
          <Search size={18} aria-hidden="true" />
          <span className="stg-visually-hidden">Rechercher une opportunité</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une opportunité…" />
        </label>
        <label>Type
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">Tous les types</option>
            <option>Stage</option>
            <option>Concours</option>
            <option>Hackathon</option>
          </select>
        </label>
      </div>
      <div className="stg-opportunity-list">
        {visible.length === 0 ? (
          <EmptyState title="Aucune opportunité trouvée" detail="Modifiez la recherche ou le type d’opportunité." />
        ) : visible.map((item) => (
          <article className="stg-opportunity" key={item.id}>
            <span className="stg-opportunity__kind">{item.kind}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.detail}</p>
              <small>{item.organization} · {item.filiere}</small>
            </div>
            <div className="stg-opportunity__date"><span>À candidater avant</span><time dateTime={item.deadline}>{formatDate(item.deadline)}</time></div>
          </article>
        ))}
      </div>
      <p className="stg-footnote">Ces propositions sont fictives et servent uniquement à la démonstration.</p>
    </PageFrame>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  if (user === null) return null

  const changePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Renseignez les trois champs pour continuer.')
      return
    }
    if (currentPassword !== 'demo1234') {
      setError('Le mot de passe actuel est incorrect.')
      return
    }
    if (newPassword.trim().length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    showToast('Le changement est simulé : aucun mot de passe n’a été modifié.', 'info')
  }

  return (
    <PageFrame
      eyebrow="Espace stagiaire · Compte"
      title="Mon profil"
      intro="Vérifiez les informations associées à votre compte de démonstration."
    >
      <div className="stg-profile-grid">
        <section className="stg-panel">
          <p className="stg-kicker">Informations de formation</p>
          <h2>{user.name}</h2>
          <dl className="stg-profile-details">
            <div><dt>Adresse e-mail</dt><dd>{user.email}</dd></div>
            <div><dt>Filière</dt><dd>{user.filiere ?? 'Non renseignée'}</dd></div>
            <div><dt>Groupe</dt><dd>1re année · Groupe A</dd></div>
            <div><dt>Compte</dt><dd>Profil fictif · Mode démonstration</dd></div>
          </dl>
        </section>
        <section className="stg-panel">
          <p className="stg-kicker">Sécurité</p>
          <h2>Changer le mot de passe</h2>
          <p className="stg-panel__intro">Cette action est simulée et ne modifie pas vos identifiants de démonstration.</p>
          <form className="stg-form" onSubmit={changePassword}>
            <label>Mot de passe actuel
              <input aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? 'stg-profile-error' : undefined} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError('') }} />
            </label>
            <label>Nouveau mot de passe
              <input aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? 'stg-profile-error' : undefined} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError('') }} />
            </label>
            <label>Confirmer le nouveau mot de passe
              <input aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? 'stg-profile-error' : undefined} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError('') }} />
            </label>
            {error && <p className="stg-form-error" id="stg-profile-error" role="alert">{error}</p>}
            <button className="stg-primary-button" type="submit">Enregistrer le changement</button>
            <small>Pour le test, le mot de passe actuel est <code>demo1234</code>.</small>
          </form>
        </section>
      </div>
    </PageFrame>
  )
}

export {
  AnnouncementsPage,
  ClubsPage,
  DashboardPage,
  LibraryPage,
  NewRequestPage,
  OpportunitiesPage,
  ProfilePage,
  RequestDetailPage,
  RequestsPage,
  SchedulePage,
}
