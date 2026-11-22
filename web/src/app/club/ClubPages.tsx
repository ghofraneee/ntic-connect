import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpRight, CalendarDays, Download, MapPin, Trash2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import type { ClubEvent } from '../../data/db'
import { useData } from '../../data/useData'
import { useToast } from '../../components/app/useToast'
import './ClubPages.css'

const appLoadedAt = Date.now()

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toLocalInputValue(value: string): string {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
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
    <section className="club-page">
      <header className="club-page__heading">
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
    <div className="club-loading" role="status" aria-label="Chargement">
      <span /><span /><span />
    </div>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="club-empty">
      <span aria-hidden="true">—</span>
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  )
}

function StatCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className="club-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
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
      ref={dialog}
      className="club-confirm-dialog"
      aria-labelledby="club-confirm-title"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
    >
      <p className="club-kicker">Confirmation</p>
      <h2 id="club-confirm-title">Supprimer cet événement ?</h2>
      <p>« {title} » sera retiré des activités du club. Les stagiaires inscrits seront informés.</p>
      <div className="club-dialog-actions">
        <button className="club-secondary-button" type="button" onClick={onCancel}>Annuler</button>
        <button className="club-danger-button" type="button" onClick={onConfirm}><Trash2 size={16} /> Supprimer</button>
      </div>
    </dialog>
  )
}

function DashboardPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { clubs, events, registrations, clubJoinRequests } = useData()
  if (!ready) return <LoadingState />
  if (user === null) return null

  const club = clubs.find((item) => item.managerId === user.id) ?? clubs[0]
  const clubEvents = events.filter((event) => event.clubId === club.id)
  const upcoming = clubEvents
    .filter((event) => new Date(event.startsAt).getTime() >= appLoadedAt)
    .slice()
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
  const pending = clubJoinRequests.filter(
    (request) => request.clubId === club.id && request.status === 'pending',
  )

  return (
    <PageFrame
      eyebrow="Espace Responsable de club · Tableau de bord"
      title={club.name}
      intro="Suivez les membres, les inscriptions et les prochaines activités."
    >
      <div className="club-stat-grid">
        <StatCard label="Mon club" value={club.memberCount} note="Membres enregistrés" />
        <StatCard label="Événements à venir" value={upcoming.length} note="Activités publiées" />
        <StatCard label="Demandes en attente" value={pending.length} note="Adhésions à examiner" />
      </div>
      <div className="club-dashboard-grid">
        <section className="club-panel">
          <div className="club-panel-heading">
            <div>
              <p className="club-kicker">À venir</p>
              <h2>Prochains événements</h2>
            </div>
            <Link to="/app/club/evenements">Tous les événements <ArrowUpRight size={15} /></Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Aucun événement à venir" detail="Créez une activité pour l’afficher aux stagiaires." />
          ) : (
            <ul className="club-event-list">
              {upcoming.slice(0, 4).map((event) => {
                const count = registrations.filter((item) => item.eventId === event.id).length
                return (
                  <li key={event.id}>
                    <CalendarDays size={18} aria-hidden="true" />
                    <span>
                      <strong>{event.title}</strong>
                      <small>{formatDateTime(event.startsAt)} · {count}/{event.capacity} places</small>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <section className="club-panel">
          <div className="club-panel-heading">
            <div>
              <p className="club-kicker">Adhésions</p>
              <h2>Demandes récentes</h2>
            </div>
            <Link to="/app/club/membres">Voir les membres <ArrowUpRight size={15} /></Link>
          </div>
          {pending.length === 0 ? (
            <EmptyState title="Aucune demande en attente" detail="Les nouvelles demandes apparaîtront ici." />
          ) : (
            <ul className="club-member-requests">
              {pending.slice(0, 5).map((request) => (
                <li key={request.id}>
                  <span><strong>{request.userName}</strong><small>{request.filiere ?? 'Filière non renseignée'}</small></span>
                  <time dateTime={request.requestedAt}>{formatDate(request.requestedAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

function EventsPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { clubs, events, addEvent, updateEvent, deleteEvent } = useData()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<ClubEvent | null>(null)
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState(30)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ClubEvent | null>(null)
  if (!ready) return <LoadingState />
  if (user === null) return null

  const club = clubs.find((item) => item.managerId === user.id) ?? clubs[0]
  const clubEvents = events
    .filter((event) => event.clubId === club.id)
    .slice()
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))

  const resetForm = () => {
    setEditing(null)
    setTitle('')
    setStartsAt('')
    setLocation('')
    setDescription('')
    setCapacity(30)
    setError('')
  }

  const openEdit = (event: ClubEvent) => {
    setEditing(event)
    setTitle(event.title)
    setStartsAt(toLocalInputValue(event.startsAt))
    setLocation(event.location)
    setDescription(event.description)
    setCapacity(event.capacity)
    setError('')
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !startsAt || !location.trim() || !description.trim()) {
      setError('Le titre, la date, le lieu et la description sont obligatoires.')
      return
    }
    if (capacity < 1) {
      setError('La capacité doit être au moins de 1 place.')
      return
    }
    try {
      const input = {
        clubId: club.id,
        title: title.trim(),
        startsAt: new Date(startsAt).toISOString(),
        location: location.trim(),
        description: description.trim(),
        capacity,
      }
      if (editing) {
        updateEvent(editing.id, input, user)
        showToast('L’événement a été mis à jour.', 'success')
      } else {
        addEvent(input, user)
        showToast('L’événement a été publié.', 'success')
      }
      resetForm()
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Impossible d’enregistrer cet événement.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const removeEvent = () => {
    if (!pendingDelete) return
    try {
      deleteEvent(pendingDelete.id, user)
      setPendingDelete(null)
      showToast('L’événement a été supprimé.', 'success')
      if (editing?.id === pendingDelete.id) resetForm()
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Impossible de supprimer cet événement.', 'error')
    }
  }

  return (
    <PageFrame
      eyebrow="Espace Responsable de club · Activités"
      title="Événements"
      intro="Planifiez une rencontre et tenez les stagiaires informés."
    >
      <div className="club-events-layout">
        <section className="club-panel club-event-form-panel">
          <p className="club-kicker">{editing ? 'Modification' : 'Nouvelle activité'}</p>
          <h2>{editing ? 'Modifier l’événement' : 'Créer un événement'}</h2>
          <form className="club-form" onSubmit={submit}>
            <label>Titre
              <input aria-required="true" value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} placeholder="Ex. Atelier de programmation" />
            </label>
            <label>Date et heure
              <input aria-required="true" type="datetime-local" value={startsAt} onChange={(event) => { setStartsAt(event.target.value); setError('') }} />
            </label>
            <label>Lieu
              <input aria-required="true" value={location} onChange={(event) => { setLocation(event.target.value); setError('') }} placeholder="Ex. Salle informatique B12" />
            </label>
            <label>Description
              <textarea aria-required="true" rows={4} value={description} onChange={(event) => { setDescription(event.target.value); setError('') }} placeholder="Décrivez brièvement l’activité." />
            </label>
            <label>Capacité
              <input aria-required="true" type="number" min={1} value={capacity} onChange={(event) => { setCapacity(Number(event.target.value)); setError('') }} />
            </label>
            {error && <p className="club-error" role="alert">{error}</p>}
            <div className="club-form-actions">
              {editing && <button className="club-secondary-button" type="button" onClick={resetForm}>Annuler</button>}
              <button className="club-primary-button" type="submit">{editing ? 'Mettre à jour' : 'Publier l’événement'}</button>
            </div>
          </form>
        </section>
        <section className="club-published">
          <div className="club-panel-heading">
            <div>
              <p className="club-kicker">Calendrier</p>
              <h2>Activités du club</h2>
            </div>
            <span>{clubEvents.length}</span>
          </div>
          {clubEvents.length === 0 ? (
            <EmptyState title="Aucun événement publié" detail="Votre premier événement apparaîtra ici." />
          ) : (
            <div className="club-published-list">
              {clubEvents.map((event) => (
                <article key={event.id}>
                  <div className="club-published-list__title">
                    <strong>{event.title}</strong>
                    <span><CalendarDays size={14} /> {formatDateTime(event.startsAt)}</span>
                    <span><MapPin size={14} /> {event.location}</span>
                  </div>
                  <p>{event.description}</p>
                  <div className="club-row-actions">
                    <button type="button" onClick={() => openEdit(event)}>Modifier</button>
                    <button type="button" onClick={() => setPendingDelete(event)}><Trash2 size={15} /> Supprimer</button>
                  </div>
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
        onConfirm={removeEvent}
      />
    </PageFrame>
  )
}

function ParticipantsPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { clubs, events, registrations } = useData()
  const { showToast } = useToast()
  const [eventId, setEventId] = useState('all')
  if (!ready) return <LoadingState />
  if (user === null) return null

  const club = clubs.find((item) => item.managerId === user.id) ?? clubs[0]
  const clubEvents = events
    .filter((event) => event.clubId === club.id)
    .slice()
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
  const rows = registrations
    .filter((registration) => {
      const event = clubEvents.find((item) => item.id === registration.eventId)
      return Boolean(event) && (eventId === 'all' || registration.eventId === eventId)
    })
    .slice()
    .sort((left, right) => right.registeredAt.localeCompare(left.registeredAt))

  const exportParticipants = () => {
    showToast('La liste des participants est prête à être exportée.', 'success')
  }

  return (
    <PageFrame
      eyebrow="Espace Responsable de club · Inscriptions"
      title="Participants"
      intro="Consultez les stagiaires inscrits à vos activités."
    >
      <div className="club-filter-bar">
        <label>Événement
          <select value={eventId} onChange={(event) => setEventId(event.target.value)}>
            <option value="all">Tous les événements</option>
            {clubEvents.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}
          </select>
        </label>
        <button className="club-secondary-button" type="button" onClick={exportParticipants}><Download size={16} /> Exporter</button>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Aucune inscription" detail="Les participants apparaîtront après une inscription d’un stagiaire." />
      ) : (
        <div className="club-table-wrap">
          <table className="club-table">
            <thead><tr><th>Stagiaire</th><th>Événement</th><th>Date d’inscription</th></tr></thead>
            <tbody>
              {rows.map((registration) => {
                const event = clubEvents.find((item) => item.id === registration.eventId)
                return (
                  <tr key={registration.id}>
                    <td><strong>{registration.userName}</strong><small>{registration.userId}</small></td>
                    <td>{event?.title ?? 'Événement supprimé'}</td>
                    <td>{formatDate(registration.registeredAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageFrame>
  )
}

function MembersPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { clubs, clubJoinRequests, resolveClubJoinRequest, removeClubMember } = useData()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending')
  if (!ready) return <LoadingState />
  if (user === null) return null

  const club = clubs.find((item) => item.managerId === user.id) ?? clubs[0]
  const visible = clubJoinRequests
    .filter((request) => {
      const matchesClub = request.clubId === club.id
      const matchesTab =
        tab === 'pending'
          ? request.status === 'pending'
          : request.status === 'accepted'
      const matchesQuery =
        `${request.userName} ${request.filiere ?? ''}`
          .toLocaleLowerCase('fr')
          .includes(query.toLocaleLowerCase('fr'))
      return matchesClub && matchesTab && matchesQuery
    })
    .slice()
    .sort((left, right) => right.requestedAt.localeCompare(left.requestedAt))

  const resolve = (requestId: string, decision: 'accepted' | 'refused', name: string) => {
    try {
      resolveClubJoinRequest(requestId, decision)
      showToast(
        decision === 'accepted'
          ? `${name} a été accepté·e dans le club.`
          : `La demande de ${name} a été refusée.`,
        'success',
      )
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Impossible de traiter la demande.', 'error')
    }
  }

  const removeMember = (requestId: string, name: string) => {
    try {
      removeClubMember(requestId)
      showToast(`${name} a été retiré·e du club.`, 'success')
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Impossible de retirer ce membre.', 'error')
    }
  }

  return (
    <PageFrame
      eyebrow="Espace Responsable de club · Communauté"
      title="Membres"
      intro="Acceptez les nouvelles adhésions ou retirez un membre."
    >
      <div className="club-member-toolbar">
        <div className="club-tabs" role="tablist" aria-label="Type de membres">
          <button type="button" role="tab" aria-selected={tab === 'pending'} onClick={() => setTab('pending')}>Demandes en attente</button>
          <button type="button" role="tab" aria-selected={tab === 'accepted'} onClick={() => setTab('accepted')}>Membres acceptés</button>
        </div>
        <label>Rechercher
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou filière…" />
        </label>
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'Aucune demande en attente' : 'Aucun membre accepté'}
          detail={tab === 'pending' ? 'Les nouvelles demandes apparaîtront ici.' : 'Les adhésions acceptées apparaîtront ici.'}
        />
      ) : (
        <div className="club-member-list">
          {visible.map((request) => (
            <article key={request.id}>
              <div className="club-member-avatar" aria-hidden="true">{request.userName.charAt(0)}</div>
              <div className="club-member-name">
                <strong>{request.userName}</strong>
                <span>{request.filiere ?? 'Filière non renseignée'}</span>
              </div>
              <time dateTime={request.requestedAt}>{formatDate(request.requestedAt)}</time>
              {tab === 'pending' ? (
                <div className="club-member-actions">
                  <button className="club-primary-button" type="button" onClick={() => resolve(request.id, 'accepted', request.userName)}>Accepter</button>
                  <button className="club-secondary-button" type="button" onClick={() => resolve(request.id, 'refused', request.userName)}>Refuser</button>
                </div>
              ) : (
                <button className="club-remove-member" type="button" onClick={() => removeMember(request.id, request.userName)}><Users size={15} /> Retirer</button>
              )}
            </article>
          ))}
        </div>
      )}
    </PageFrame>
  )
}

export {
  DashboardPage,
  EventsPage,
  MembersPage,
  ParticipantsPage,
}
