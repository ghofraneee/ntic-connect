import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import {
  ArrowUpRight,
  Edit3,
  FilePlus2,
  FileText,
  Megaphone,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import type { Lesson, LessonFormat } from '../../data/db'
import { useData } from '../../data/useData'
import { useToast } from '../../components/app/useToast'
import './FormateurPages.css'

const appLoadedAt = Date.now()
const filieres = [
  'Développement Digital',
  'Infrastructure Digitale',
  'Gestion des entreprises',
] as const
const sections = [
  '1re année · Groupe A',
  '1re année · Groupe B',
  '2e année · Groupe A',
  '2e année · Groupe B',
] as const
const formats: LessonFormat[] = ['Cours', 'Support', 'Travaux pratiques']

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
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
    <section className="frm-page">
      <header className="frm-page__heading">
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
    <div className="frm-loading" role="status" aria-label="Chargement">
      <span />
      <span />
      <span />
    </div>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="frm-empty">
      <span aria-hidden="true">—</span>
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  )
}

function StatCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className="frm-stat">
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
      className="frm-confirm-dialog"
      aria-labelledby="frm-confirm-title"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
    >
      <p className="frm-kicker">Confirmation</p>
      <h2 id="frm-confirm-title">Supprimer ce cours ?</h2>
      <p>« {title} » sera retiré de la bibliothèque numérique. Cette action ne peut pas être annulée.</p>
      <div className="frm-dialog-actions">
        <button className="frm-secondary-button" type="button" onClick={onCancel}>Annuler</button>
        <button className="frm-danger-button" type="button" onClick={onConfirm}><Trash2 size={16} /> Supprimer</button>
      </div>
    </dialog>
  )
}

function DashboardPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { lessons, announcements, getAnnouncementsFor } = useData()
  if (!ready) return <LoadingState />
  if (user === null) return null

  const myLessons = lessons.filter((lesson) => lesson.trainer === user.name)
  const weekLimit = appLoadedAt - 7 * 86400000
  const filesThisWeek = myLessons.filter(
    (lesson) => new Date(lesson.createdAt).getTime() >= weekLimit,
  ).length
  const mySections = Array.from(new Set(myLessons.map((lesson) => lesson.section)))
  const latestAnnouncements = getAnnouncementsFor(user)
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 4)

  return (
    <PageFrame
      eyebrow="Espace Formateur · Tableau de bord"
      title={`Bonjour ${user.name.split(' ')[0]}.`}
      intro="Vos cours, vos sections et les informations pédagogiques à consulter."
    >
      <div className="frm-stat-grid">
        <StatCard label="Mes cours" value={myLessons.length} note="Supports publiés" />
        <StatCard label="Fichiers cette semaine" value={filesThisWeek} note="Depuis les 7 derniers jours" />
        <StatCard label="Mes sections" value={mySections.length} note="Groupes suivis" />
      </div>

      <div className="frm-dashboard-grid">
        <section className="frm-panel">
          <div className="frm-panel-heading">
            <div>
              <p className="frm-kicker">Derniers cours</p>
              <h2>Ma bibliothèque</h2>
            </div>
            <Link to="/app/formateur/cours">Tous les cours <ArrowUpRight size={15} /></Link>
          </div>
          {myLessons.length === 0 ? (
            <EmptyState title="Aucun cours publié" detail="Déposez un support pour le rendre disponible aux stagiaires." />
          ) : (
            <ul className="frm-lesson-list">
              {myLessons.slice(0, 5).map((lesson) => (
                <li key={lesson.id}>
                  <FileText size={18} aria-hidden="true" />
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.subject} · {lesson.section}</small>
                  </span>
                  <time dateTime={lesson.createdAt}>{formatDate(lesson.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="frm-panel">
          <div className="frm-panel-heading">
            <div>
              <p className="frm-kicker">Sections</p>
              <h2>Groupes suivis</h2>
            </div>
          </div>
          {mySections.length === 0 ? (
            <EmptyState title="Aucune section liée" detail="Vos groupes apparaîtront après le dépôt d’un cours." />
          ) : (
            <div className="frm-section-list">
              {mySections.map((section) => (
                <div key={section}>
                  <strong>{section}</strong>
                  <span>{myLessons.filter((lesson) => lesson.section === section).length} cours</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="frm-panel frm-dashboard-announcements">
          <div className="frm-panel-heading">
            <div>
              <p className="frm-kicker">Informations</p>
              <h2>Dernières annonces</h2>
            </div>
            <Link to="/app/formateur/annonces">Voir toutes <ArrowUpRight size={15} /></Link>
          </div>
          {latestAnnouncements.length === 0 ? (
            <EmptyState title="Aucune annonce" detail="Les informations disponibles pour les formateurs apparaîtront ici." />
          ) : (
            <div className="frm-announcement-briefs">
              {latestAnnouncements.map((announcement) => (
                <article key={announcement.id}>
                  <time dateTime={announcement.createdAt}>{formatDate(announcement.createdAt)}</time>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.body}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <span className="frm-hidden-value" aria-hidden="true">{announcements.length}</span>
    </PageFrame>
  )
}

function CoursesPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { lessons, updateLesson, deleteLesson } = useData()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [filiere, setFiliere] = useState('all')
  const [section, setSection] = useState('all')
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editFiliere, setEditFiliere] = useState<typeof filieres[number]>(filieres[0])
  const [editSection, setEditSection] = useState<typeof sections[number]>(sections[0])
  const [editFormat, setEditFormat] = useState<LessonFormat>('Cours')
  const [pendingDelete, setPendingDelete] = useState<Lesson | null>(null)
  if (!ready) return <LoadingState />
  if (user === null) return null

  const myLessons = lessons.filter((lesson) => lesson.trainer === user.name)
  const visible = myLessons
    .filter((lesson) => {
      const matchesText =
        `${lesson.title} ${lesson.subject} ${lesson.fileName}`
          .toLocaleLowerCase('fr')
          .includes(query.toLocaleLowerCase('fr'))
      return (
        matchesText &&
        (filiere === 'all' || lesson.filiere === filiere) &&
        (section === 'all' || lesson.section === section)
      )
    })
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const openEdit = (lesson: Lesson) => {
    setEditing(lesson)
    setEditTitle(lesson.title)
    setEditSubject(lesson.subject)
    setEditFiliere(filieres.find((item) => item === lesson.filiere) ?? filieres[0])
    setEditSection(sections.find((item) => item === lesson.section) ?? sections[0])
    setEditFormat(lesson.format)
  }

  const saveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editing) return
    if (!editTitle.trim() || !editSubject.trim()) {
      showToast('Le titre et la matière sont obligatoires.', 'error')
      return
    }
    try {
      updateLesson(
        editing.id,
        {
          title: editTitle.trim(),
          subject: editSubject.trim(),
          filiere: editFiliere,
          section: editSection,
          format: editFormat,
        },
        user,
      )
      setEditing(null)
      showToast('Le cours a été mis à jour.', 'success')
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Impossible de modifier ce cours.', 'error')
    }
  }

  const removeLesson = () => {
    if (!pendingDelete) return
    try {
      deleteLesson(pendingDelete.id, user)
      setPendingDelete(null)
      showToast('Le cours a été supprimé.', 'success')
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Impossible de supprimer ce cours.', 'error')
    }
  }

  return (
    <PageFrame
      eyebrow="Espace Formateur · Ressources"
      title="Mes cours"
      intro="Modifiez les informations de vos supports ou retirez ceux qui ne sont plus utilisés."
    >
      <div className="frm-filter-panel">
        <label className="frm-search">
          <Search size={17} aria-hidden="true" />
          <span className="frm-visually-hidden">Rechercher un cours</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, matière, fichier…" />
        </label>
        <label>Filière
          <select value={filiere} onChange={(event) => setFiliere(event.target.value)}>
            <option value="all">Toutes les filières</option>
            {filieres.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Section
          <select value={section} onChange={(event) => setSection(event.target.value)}>
            <option value="all">Toutes les sections</option>
            {sections.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <Link className="frm-primary-link" to="/app/formateur/deposer-un-cours"><FilePlus2 size={16} /> Déposer un cours</Link>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Aucun cours trouvé" detail="Modifiez les filtres ou ajoutez un nouveau support." />
      ) : (
        <div className="frm-table-wrap">
          <table className="frm-table">
            <thead>
              <tr><th>Cours</th><th>Matière</th><th>Filière</th><th>Section</th><th>Format</th><th /></tr>
            </thead>
            <tbody>
              {visible.map((lesson) => (
                <tr key={lesson.id}>
                  <td><strong>{lesson.title}</strong><small>{lesson.fileName} · {lesson.fileSize}</small></td>
                  <td>{lesson.subject}</td>
                  <td>{lesson.filiere}</td>
                  <td>{lesson.section}</td>
                  <td>{lesson.format}</td>
                  <td>
                    <div className="frm-row-actions">
                      <button type="button" aria-label={`Modifier ${lesson.title}`} onClick={() => openEdit(lesson)}><Edit3 size={16} /></button>
                      <button type="button" aria-label={`Supprimer ${lesson.title}`} onClick={() => setPendingDelete(lesson)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <section className="frm-edit-panel" aria-labelledby="frm-edit-title">
          <div className="frm-panel-heading">
            <div>
              <p className="frm-kicker">Modifier</p>
              <h2 id="frm-edit-title">{editing.title}</h2>
            </div>
            <button className="frm-icon-text-button" type="button" onClick={() => setEditing(null)}>Fermer</button>
          </div>
          <form className="frm-form" onSubmit={saveEdit}>
            <label>Titre
              <input aria-required="true" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </label>
            <label>Matière
              <input aria-required="true" value={editSubject} onChange={(event) => setEditSubject(event.target.value)} />
            </label>
            <label>Filière
              <select value={editFiliere} onChange={(event) => setEditFiliere(event.target.value as typeof filieres[number])}>
                {filieres.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Section
              <select value={editSection} onChange={(event) => setEditSection(event.target.value as typeof sections[number])}>
                {sections.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Type
              <select value={editFormat} onChange={(event) => setEditFormat(event.target.value as LessonFormat)}>
                {formats.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button className="frm-primary-button" type="submit">Enregistrer les modifications</button>
          </form>
        </section>
      )}

      <ConfirmationDialog
        open={pendingDelete !== null}
        title={pendingDelete?.title ?? ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={removeLesson}
      />
    </PageFrame>
  )
}

function UploadPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { addLesson } = useData()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [filiere, setFiliere] = useState<typeof filieres[number]>(filieres[0])
  const [section, setSection] = useState<typeof sections[number]>(sections[0])
  const [format, setFormat] = useState<LessonFormat>('Cours')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [error, setError] = useState('')
  if (!ready) return <LoadingState />
  if (user === null) return null

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFileName('')
      setFileSize('')
      return
    }
    setFileName(file.name)
    const sizeMb = file.size / 1048576
    setFileSize(sizeMb >= 1 ? `${sizeMb.toFixed(1)} Mo` : `${Math.max(1, Math.round(file.size / 1024))} Ko`)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !subject.trim() || !fileName.trim()) {
      setError('Le titre, la matière et le fichier sont obligatoires.')
      return
    }
    try {
      addLesson(
        {
          title: title.trim(),
          subject: subject.trim(),
          filiere,
          section,
          format,
          fileName,
          fileSize: fileSize || 'Taille inconnue',
        },
        user,
      )
      setTitle('')
      setSubject('')
      setFileName('')
      setFileSize('')
      setError('')
      showToast('Le cours a été ajouté à la bibliothèque.', 'success')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Impossible de déposer ce cours.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <PageFrame
      eyebrow="Espace Formateur · Publication"
      title="Déposer un cours"
      intro="Ajoutez un support à la bibliothèque de la filière concernée."
    >
      <form className="frm-upload-layout" onSubmit={submit}>
        <div className="frm-panel frm-upload-fields">
          <p className="frm-kicker">Informations du cours</p>
          <h2>Fiche pédagogique</h2>
          <div className="frm-form">
            <label>Titre
              <input aria-required="true" value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} placeholder="Ex. Requêtes SQL : jointures" />
            </label>
            <label>Matière
              <input aria-required="true" value={subject} onChange={(event) => { setSubject(event.target.value); setError('') }} placeholder="Ex. SQL" />
            </label>
            <label>Filière
              <select value={filiere} onChange={(event) => setFiliere(event.target.value as typeof filieres[number])}>
                {filieres.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Section
              <select value={section} onChange={(event) => setSection(event.target.value as typeof sections[number])}>
                {sections.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Type
              <select value={format} onChange={(event) => setFormat(event.target.value as LessonFormat)}>
                {formats.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="frm-panel frm-file-panel">
          <p className="frm-kicker">Document</p>
          <h2>Fichier de cours</h2>
          <label className="frm-file-input">
            <Upload size={24} aria-hidden="true" />
            <strong>Choisir un fichier</strong>
            <span>PDF, document ou archive — démonstration locale</span>
            <input type="file" onChange={onFileChange} />
          </label>
          {fileName ? (
            <div className="frm-file-preview">
              <FileText size={20} aria-hidden="true" />
              <span><strong>{fileName}</strong><small>{fileSize || 'Fichier sélectionné'}</small></span>
            </div>
          ) : (
            <p className="frm-file-empty">Aucun fichier sélectionné.</p>
          )}
          {error && <p className="frm-error" role="alert">{error}</p>}
          <button className="frm-primary-button" type="submit"><Upload size={16} /> Déposer le cours</button>
        </div>
      </form>
    </PageFrame>
  )
}

function AnnouncementsPage() {
  const ready = usePageReady()
  const { user } = useAuth()
  const { announcements, addAnnouncement } = useData()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [filiere, setFiliere] = useState<typeof filieres[number]>(filieres[0])
  const [section, setSection] = useState<typeof sections[number]>(sections[0])
  const [error, setError] = useState('')
  if (!ready) return <LoadingState />
  if (user === null) return null

  const mine = announcements
    .filter((announcement) =>
      announcement.publishedBy === user.name ||
      (announcement.targetSection && announcement.targetSection === section),
    )
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const publish = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Le titre et le texte sont obligatoires.')
      return
    }
    try {
      addAnnouncement(
        {
          title,
          body,
          target: 'filiere',
          targetFiliere: filiere,
          targetSection: section,
        },
        user,
      )
      setTitle('')
      setBody('')
      setError('')
      showToast(`Annonce publiée pour ${section}.`, 'success')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Impossible de publier l’annonce.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <PageFrame
      eyebrow="Espace Formateur · Communication"
      title="Annonces"
      intro="Informez une section précise de votre filière."
    >
      <div className="frm-announcement-layout">
        <section className="frm-panel frm-compose">
          <p className="frm-kicker">Nouvelle annonce</p>
          <h2>Écrire pour une section</h2>
          <form className="frm-form" onSubmit={publish}>
            <label>Titre
              <input aria-required="true" value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} placeholder="Ex. Atelier de révision SQL" />
            </label>
            <label>Texte
              <textarea aria-required="true" rows={5} value={body} onChange={(event) => { setBody(event.target.value); setError('') }} placeholder="Indiquez clairement le lieu, la date ou l’objectif." />
            </label>
            <label>Filière
              <select value={filiere} onChange={(event) => setFiliere(event.target.value as typeof filieres[number])}>
                {filieres.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Section
              <select value={section} onChange={(event) => setSection(event.target.value as typeof sections[number])}>
                {sections.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            {error && <p className="frm-error" role="alert">{error}</p>}
            <button className="frm-primary-button" type="submit"><Megaphone size={16} /> Publier pour cette section</button>
          </form>
        </section>
        <section className="frm-published">
          <div className="frm-panel-heading">
            <div>
              <p className="frm-kicker">Historique</p>
              <h2>Mes publications</h2>
            </div>
            <span>{mine.length}</span>
          </div>
          {mine.length === 0 ? (
            <EmptyState title="Aucune publication" detail="Les annonces ciblées apparaîtront ici." />
          ) : (
            <div className="frm-announcement-list">
              {mine.map((announcement) => (
                <article key={announcement.id}>
                  <time dateTime={announcement.createdAt}>{formatDate(announcement.createdAt)}</time>
                  <div>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.body}</p>
                    <small>{announcement.targetFiliere} · {announcement.targetSection}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  const { lessons } = useData()
  const { showToast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  if (user === null) return null

  const myLessons = lessons.filter((lesson) => lesson.trainer === user.name)
  const sections = Array.from(new Set(myLessons.map((lesson) => lesson.section)))

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Renseignez les trois champs.')
      return
    }
    if (currentPassword !== 'demo1234') {
      setError('Le mot de passe actuel est incorrect.')
      return
    }
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    showToast('Le changement de mot de passe est simulé.', 'info')
  }

  return (
    <PageFrame
      eyebrow="Espace Formateur · Compte"
      title="Mon profil"
      intro="Informations du formateur et paramètres de démonstration."
    >
      <div className="frm-profile-grid">
        <section className="frm-panel">
          <p className="frm-kicker">Profil pédagogique</p>
          <h2>{user.name}</h2>
          <dl className="frm-profile-details">
            <div><dt>Adresse e-mail</dt><dd>{user.email}</dd></div>
            <div><dt>Rôle</dt><dd>Formateur · Profil fictif</dd></div>
            <div><dt>Cours publiés</dt><dd>{myLessons.length}</dd></div>
            <div><dt>Sections</dt><dd>{sections.length ? sections.join(' · ') : 'Aucune section liée'}</dd></div>
          </dl>
        </section>
        <section className="frm-panel">
          <p className="frm-kicker">Sécurité</p>
          <h2>Changer le mot de passe</h2>
          <form className="frm-form" onSubmit={submit}>
            <label>Mot de passe actuel
              <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError('') }} />
            </label>
            <label>Nouveau mot de passe
              <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError('') }} />
            </label>
            <label>Confirmer le nouveau mot de passe
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError('') }} />
            </label>
            {error && <p className="frm-error" role="alert">{error}</p>}
            <button className="frm-primary-button" type="submit">Enregistrer</button>
            <small className="frm-password-hint">Mot de passe de démonstration : <code>demo1234</code>.</small>
          </form>
        </section>
      </div>
    </PageFrame>
  )
}

export {
  AnnouncementsPage,
  CoursesPage,
  DashboardPage,
  ProfilePage,
  UploadPage,
}
