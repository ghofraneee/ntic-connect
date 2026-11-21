import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowUpRight, CalendarDays, Search, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import type { AuthUser } from '../../auth/roles'
import type {
  AdministrativeRequest,
  Announcement,
  AnnouncementTarget,
  RequestStatus,
  RequestType,
} from '../../data/db'
import { REQUEST_STATUS_LABELS } from '../../data/db'
import { useData } from '../../data/useData'
import { useToast } from '../../components/app/useToast'
import './DirectionPages.css'

const appLoadedAt = Date.now()
const requestTypes: RequestType[] = [
  'Attestation de scolarité',
  'Information administrative',
  'Problème d’équipement',
  'Suggestion',
  'Réclamation',
]
const statusOptions: RequestStatus[] = [
  'envoyee',
  'en_verification',
  'en_traitement',
  'traitee',
  'refusee',
]
const announcementTargets: { value: AnnouncementTarget; label: string }[] = [
  { value: 'tous', label: 'Toute la communauté' },
  { value: 'filiere', label: 'Une filière' },
  { value: 'formateurs', label: 'Formateurs' },
  { value: 'stagiaires', label: 'Stagiaires' },
]

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function announcementTargetLabel(announcement: Announcement): string {
  if (announcement.target === 'filiere') {
    return announcement.targetFiliere ?? 'Filière'
  }
  return announcementTargets.find((target) => target.value === announcement.target)?.label ?? ''
}

function usePageReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), 320)
    return () => window.clearTimeout(timeout)
  }, [])
  return ready
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
    <section className="dir-page">
      <header className="dir-page__heading">
        <p className="app-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro && <p className="app-page__intro">{intro}</p>}
      </header>
      {children}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="dir-loading" role="status" aria-label="Chargement">
      <span />
      <span />
      <span />
    </div>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="dir-empty">
      <span aria-hidden="true">—</span>
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`dir-status dir-status--${status}`}>
      {REQUEST_STATUS_LABELS[status]}
    </span>
  )
}

function StatBlock({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className="dir-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

function SimpleBarChart({
  title,
  rows,
}: {
  title: string
  rows: { label: string; count: number }[]
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.count))
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return (
    <section className="dir-panel dir-chart" aria-label={`${title}, ${total} demandes au total`}>
      <p className="dir-kicker">Répartition</p>
      <h2>{title}</h2>
      {rows.map((row) => (
        <div className="dir-chart__row" key={row.label}>
          <span className="dir-chart__label">{row.label}</span>
          <span className="dir-chart__track" aria-hidden="true">
            <span style={{ width: `${(row.count / maximum) * 100}%` }} />
          </span>
          <strong aria-label={`${row.count} demande${row.count === 1 ? '' : 's'}`}>{row.count}</strong>
        </div>
      ))}
    </section>
  )
}

function DashboardPage() {
  const ready = usePageReady()
  const { requests, announcements, events, clubs } = useData()
  if (!ready) return <LoadingState />

  const currentDate = new Date(appLoadedAt)
  const thisMonth = announcements.filter((announcement) => {
    const created = new Date(announcement.createdAt)
    return (
      created.getMonth() === currentDate.getMonth() &&
      created.getFullYear() === currentDate.getFullYear()
    )
  }).length
  const newRequests = requests.filter((request) => request.status === 'envoyee').length
  const processingRequests = requests.filter(
    (request) => request.status === 'en_traitement',
  ).length
  const completedRequests = requests.filter((request) => request.status === 'traitee').length
  const byStatus = statusOptions.map((status) => ({
    label: REQUEST_STATUS_LABELS[status],
    count: requests.filter((request) => request.status === status).length,
  }))
  const byType = requestTypes.map((type) => ({
    label: type,
    count: requests.filter((request) => request.type === type).length,
  }))
  const latestRequests = requests
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5)
  const upcomingEvents = events
    .filter((event) => new Date(event.startsAt).getTime() >= appLoadedAt)
    .slice()
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 3)

  return (
    <PageFrame
      eyebrow="Espace Direction · Pilotage"
      title="Vue d’ensemble"
      intro="Les demandes, les annonces et les activités de l’établissement."
    >
      <div className="dir-stat-grid">
        <StatBlock label="Nouvelles demandes" value={newRequests} note="À examiner" />
        <StatBlock label="En traitement" value={processingRequests} note="Suivi en cours" />
        <StatBlock label="Demandes traitées" value={completedRequests} note="Réponses apportées" />
        <StatBlock label="Annonces du mois" value={thisMonth} note="Tous publics confondus" />
      </div>

      <div className="dir-chart-grid">
        <SimpleBarChart title="Demandes par statut" rows={byStatus} />
        <SimpleBarChart title="Demandes par type" rows={byType} />
      </div>

      <div className="dir-dashboard-grid">
        <section className="dir-panel dir-dashboard-requests">
          <div className="dir-panel-heading">
            <div>
              <p className="dir-kicker">À traiter</p>
              <h2>Demandes récentes</h2>
            </div>
            <Link to="/app/direction/demandes">Toutes les demandes <ArrowUpRight size={15} /></Link>
          </div>
          {latestRequests.length === 0 ? (
            <EmptyState title="Aucune demande" detail="Les nouvelles demandes apparaîtront ici." />
          ) : (
            <div className="dir-table-wrap">
              <table className="dir-table">
                <thead>
                  <tr><th>Stagiaire</th><th>Type</th><th>Mise à jour</th><th>Statut</th><th /></tr>
                </thead>
                <tbody>
                  {latestRequests.map((request) => (
                    <tr key={request.id}>
                      <td><Link to={`/app/direction/demandes/${request.id}`}>{request.ownerName}<small>{request.id}</small></Link></td>
                      <td>{request.type}</td>
                      <td>{formatDate(request.updatedAt)}</td>
                      <td><StatusBadge status={request.status} /></td>
                      <td><Link aria-label={`Ouvrir ${request.id}`} to={`/app/direction/demandes/${request.id}`}><ArrowUpRight size={16} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dir-panel dir-dashboard-events">
          <div className="dir-panel-heading">
            <div>
              <p className="dir-kicker">Vie de l’établissement</p>
              <h2>Activités à venir</h2>
            </div>
            <Link to="/app/direction/activites">Calendrier <ArrowUpRight size={15} /></Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <EmptyState title="Aucune activité prévue" detail="Les événements des clubs seront affichés ici." />
          ) : (
            <ul className="dir-event-list">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <CalendarDays size={18} aria-hidden="true" />
                  <span>
                    <strong>{event.title}</strong>
                    <small>{clubs.find((club) => club.id === event.clubId)?.name ?? 'Club'} · {formatDateTime(event.startsAt)}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

function RequestsPage() {
  const ready = usePageReady()
  const { requests } = useData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [period, setPeriod] = useState('all')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [page, setPage] = useState(1)
  if (!ready) return <LoadingState />

  const filtered = requests.filter((request) => {
    const searchText =
      `${request.id} ${request.ownerName} ${request.filiere} ${request.type}`.toLocaleLowerCase('fr')
    const age = appLoadedAt - new Date(request.createdAt).getTime()
    const matchesDate =
      period === 'all' ||
      (period === '30' && age <= 30 * 86400000) ||
      (period === '90' && age <= 90 * 86400000)
    return (
      searchText.includes(query.toLocaleLowerCase('fr')) &&
      (status === 'all' || request.status === status) &&
      (type === 'all' || request.type === type) &&
      matchesDate
    )
  })
  const sorted = filtered.slice().sort((left, right) => {
    if (sort === 'name') return left.ownerName.localeCompare(right.ownerName, 'fr')
    return sort === 'newest'
      ? right.createdAt.localeCompare(left.createdAt)
      : left.createdAt.localeCompare(right.createdAt)
  })
  const pageSize = 6
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const updateFilter = (callback: () => void) => {
    callback()
    setPage(1)
  }

  return (
    <PageFrame
      eyebrow="Espace Direction · Suivi administratif"
      title="Demandes"
      intro="Retrouvez les demandes des stagiaires et mettez à jour leur avancement."
    >
      <div className="dir-filter-panel">
        <label className="dir-search">
          <Search size={17} aria-hidden="true" />
          <span className="dir-visually-hidden">Rechercher une demande</span>
          <input value={query} onChange={(event) => updateFilter(() => setQuery(event.target.value))} placeholder="Nom, numéro, filière…" />
        </label>
        <label>Statut
          <select value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value))}>
            <option value="all">Tous les statuts</option>
            {statusOptions.map((option) => <option value={option} key={option}>{REQUEST_STATUS_LABELS[option]}</option>)}
          </select>
        </label>
        <label>Type
          <select value={type} onChange={(event) => updateFilter(() => setType(event.target.value))}>
            <option value="all">Tous les types</option>
            {requestTypes.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>Date
          <select value={period} onChange={(event) => updateFilter(() => setPeriod(event.target.value))}>
            <option value="all">Toutes les dates</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
        </label>
        <label>Trier par
          <select value={sort} onChange={(event) => updateFilter(() => setSort(event.target.value as typeof sort))}>
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="name">Nom du stagiaire</option>
          </select>
        </label>
      </div>
      <div className="dir-table-caption">{sorted.length} demande{sorted.length === 1 ? '' : 's'}</div>
      {visible.length === 0 ? (
        <EmptyState title="Aucune demande pour ces critères" detail="Modifiez les filtres ou la recherche." />
      ) : (
        <div className="dir-table-wrap">
          <table className="dir-table dir-request-table">
            <thead>
              <tr><th>Stagiaire</th><th>Type</th><th>Filière</th><th>Date</th><th>Statut</th><th /></tr>
            </thead>
            <tbody>
              {visible.map((request) => (
                <tr key={request.id}>
                  <td><Link to={`/app/direction/demandes/${request.id}`}>{request.ownerName}<small>{request.id}</small></Link></td>
                  <td>{request.type}</td>
                  <td>{request.filiere}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td><StatusBadge status={request.status} /></td>
                  <td><Link aria-label={`Ouvrir ${request.id}`} to={`/app/direction/demandes/${request.id}`}><ArrowUpRight size={16} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {sorted.length > pageSize && (
        <nav className="dir-pagination" aria-label="Pages des demandes">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Précédent</button>
          <span>Page {currentPage} sur {pageCount}</span>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Suivant</button>
        </nav>
      )}
    </PageFrame>
  )
}

function RequestUpdatePanel({
  request,
  actor,
}: {
  request: AdministrativeRequest
  actor: AuthUser
}) {
  const { updateRequestStatus } = useData()
  const { showToast } = useToast()
  const [status, setStatus] = useState<RequestStatus>(request.status)
  const [refusalReason, setRefusalReason] = useState(request.refusalReason ?? '')
  const [internalNote, setInternalNote] = useState(request.internalNote ?? '')
  const [error, setError] = useState('')

  const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'refusee' && !refusalReason.trim()) {
      setError('Le motif est obligatoire pour refuser une demande.')
      return
    }
    try {
      updateRequestStatus(
        request.id,
        { status, refusalReason, internalNote },
        actor,
      )
      setError('')
      showToast(`Le statut de ${request.id} a été mis à jour.`, 'success')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'La mise à jour n’a pas pu être enregistrée.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <section className="dir-panel">
      <p className="dir-kicker">Traitement</p>
      <h2>Mettre à jour le statut</h2>
      <form className="dir-form" onSubmit={submitUpdate}>
        <label>Statut
          <select value={status} onChange={(event) => {
            const nextStatus = event.target.value as RequestStatus
            setStatus(nextStatus)
            if (nextStatus !== 'refusee') setRefusalReason('')
            setError('')
          }}>
            {statusOptions.map((option) => <option key={option} value={option}>{REQUEST_STATUS_LABELS[option]}</option>)}
          </select>
        </label>
        {status === 'refusee' && (
          <label>Motif du refus
            <textarea
              aria-required="true"
              aria-invalid={Boolean(error)}
              rows={3}
              value={refusalReason}
              onChange={(event) => { setRefusalReason(event.target.value); setError('') }}
              placeholder="Expliquez la raison de la décision."
            />
          </label>
        )}
        <label>Note interne <span className="dir-label-note">visible par la Direction uniquement</span>
          <textarea rows={3} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Note facultative pour le suivi interne." />
        </label>
        {error && <p className="dir-error" role="alert">{error}</p>}
        <button className="dir-primary-button" type="submit">Mettre à jour</button>
      </form>
    </section>
  )
}

function RequestDetailPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { requests } = useData()
  const { requestId } = useParams()
  const request = requests.find((item) => item.id === requestId)

  if (!ready) return <LoadingState />
  if (user === null) return null
  if (!request) {
    return (
      <PageFrame eyebrow="Espace Direction · Demandes" title="Demande introuvable">
        <EmptyState title="Cette demande n’existe pas" detail="Elle a peut-être été supprimée ou le lien est incorrect." />
        <Link className="dir-secondary-button" to="/app/direction/demandes"><ArrowLeft size={16} /> Retour aux demandes</Link>
      </PageFrame>
    )
  }

  return (
    <PageFrame
      eyebrow={`Demande ${request.id}`}
      title={request.type}
      intro={`Déposée par ${request.ownerName} · ${request.filiere} · ${formatDateTime(request.createdAt)}`}
    >
      <div className="dir-detail-toolbar">
        <Link className="dir-back-link" to="/app/direction/demandes"><ArrowLeft size={16} /> Toutes les demandes</Link>
        <StatusBadge status={request.status} />
      </div>
      <div className="dir-detail-grid">
        <section className="dir-panel">
          <p className="dir-kicker">Détails transmis</p>
          <h2>Demande du stagiaire</h2>
          <p className="dir-request-body">{request.details}</p>
          <dl className="dir-request-meta">
            <div><dt>Stagiaire</dt><dd>{request.ownerName}</dd></div>
            <div><dt>Filière</dt><dd>{request.filiere}</dd></div>
            <div><dt>Créée le</dt><dd>{formatDateTime(request.createdAt)}</dd></div>
            <div><dt>Dernière mise à jour</dt><dd>{formatDateTime(request.updatedAt)}</dd></div>
          </dl>
        </section>
        <RequestUpdatePanel key={request.id} request={request} actor={user} />
      </div>

      <section className="dir-panel dir-history-panel">
        <p className="dir-kicker">Traçabilité</p>
        <h2>Historique complet</h2>
        {request.history.length === 0 ? (
          <EmptyState title="Aucune étape enregistrée" detail="L’historique apparaîtra après la première mise à jour." />
        ) : (
          <ol className="dir-history">
            {request.history.map((entry) => (
              <li key={entry.id}>
                <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                <div>
                  <strong>{REQUEST_STATUS_LABELS[entry.status]}</strong>
                  <span>{entry.actorName}</span>
                  {entry.note && <p>{entry.note}</p>}
                  {entry.reason && <p className="dir-history__reason">Motif : {entry.reason}</p>}
                  {entry.internalNote && <p className="dir-history__internal"><strong>Note interne :</strong> {entry.internalNote}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </PageFrame>
  )
}

function ConfirmationDialog({
  open,
  title,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      className="dir-confirm-dialog"
      ref={dialog}
      aria-labelledby="dir-confirm-title"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
    >
      <p className="dir-kicker">Confirmation</p>
      <h2 id="dir-confirm-title">Supprimer cette annonce ?</h2>
      <p>Cette action retirera « {title} » des annonces publiées. Elle ne peut pas être annulée.</p>
      <div className="dir-dialog-actions">
        <button className="dir-secondary-button" type="button" onClick={onCancel}>Annuler</button>
        <button className="dir-danger-button" type="button" onClick={onConfirm}><Trash2 size={16} /> Supprimer</button>
      </div>
    </dialog>
  )
}

function AnnouncementsPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { announcements, lessons, addAnnouncement, deleteAnnouncement } = useData()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<AnnouncementTarget>('tous')
  const [targetFiliere, setTargetFiliere] = useState('')
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null)
  if (!ready) return <LoadingState />
  if (user === null) return null

  const filieres = Array.from(new Set(lessons.map((lesson) => lesson.filiere))).sort()
  const published = announcements.slice().sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt),
  )

  const publish = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Le titre et le texte de l’annonce sont obligatoires.')
      return
    }
    if (target === 'filiere' && !targetFiliere) {
      setError('Choisissez la filière concernée.')
      return
    }
    try {
      addAnnouncement({ title, body, target, targetFiliere }, user)
      setTitle('')
      setBody('')
      setTarget('tous')
      setTargetFiliere('')
      setError('')
      showToast('L’annonce a été publiée.', 'success')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'L’annonce n’a pas pu être publiée.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const removeAnnouncement = () => {
    if (!pendingDelete) return
    deleteAnnouncement(pendingDelete.id)
    setPendingDelete(null)
    showToast('L’annonce a été supprimée.', 'success')
  }

  return (
    <PageFrame
      eyebrow="Espace Direction · Communication"
      title="Annonces"
      intro="Publiez une information ciblée et retrouvez les annonces déjà diffusées."
    >
      <div className="dir-announcement-layout">
        <section className="dir-panel dir-compose">
          <p className="dir-kicker">Nouvelle publication</p>
          <h2>Rédiger une annonce</h2>
          <form className="dir-form" onSubmit={publish}>
            <label>Titre
              <input aria-required="true" value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} placeholder="Ex. Horaires de la bibliothèque" />
            </label>
            <label>Texte
              <textarea aria-required="true" rows={5} value={body} onChange={(event) => { setBody(event.target.value); setError('') }} placeholder="Rédigez une information claire et utile." />
            </label>
            <label>Public cible
              <select value={target} onChange={(event) => { setTarget(event.target.value as AnnouncementTarget); setError('') }}>
                {announcementTargets.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {target === 'filiere' && (
              <label>Filière
                <select aria-required="true" value={targetFiliere} onChange={(event) => { setTargetFiliere(event.target.value); setError('') }}>
                  <option value="">Choisir une filière</option>
                  {filieres.map((filiere) => <option key={filiere}>{filiere}</option>)}
                </select>
              </label>
            )}
            {error && <p className="dir-error" role="alert">{error}</p>}
            <button className="dir-primary-button" type="submit">Publier l’annonce</button>
          </form>
        </section>
        <section className="dir-published">
          <div className="dir-panel-heading">
            <div>
              <p className="dir-kicker">Archives</p>
              <h2>Annonces publiées</h2>
            </div>
            <span>{published.length}</span>
          </div>
          {published.length === 0 ? (
            <EmptyState title="Aucune annonce publiée" detail="Les annonces créées apparaîtront ici." />
          ) : (
            <div className="dir-announcement-list">
              {published.map((announcement) => (
                <article className="dir-announcement" key={announcement.id}>
                  <div className="dir-announcement__meta">
                    <time dateTime={announcement.createdAt}>{formatDate(announcement.createdAt)}</time>
                    <span>{announcementTargetLabel(announcement)}</span>
                  </div>
                  <div className="dir-announcement__body">
                    <h3>{announcement.title}</h3>
                    <p>{announcement.body}</p>
                    <small>Publié par {announcement.publishedBy}</small>
                  </div>
                  <button
                    className="dir-delete-button"
                    type="button"
                    aria-label={`Supprimer l’annonce ${announcement.title}`}
                    onClick={() => setPendingDelete(announcement)}
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <ConfirmationDialog
        open={pendingDelete !== null}
        title={pendingDelete?.title ?? ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={removeAnnouncement}
      />
    </PageFrame>
  )
}

export {
  AnnouncementsPage,
  DashboardPage,
  RequestDetailPage,
  RequestsPage,
}
