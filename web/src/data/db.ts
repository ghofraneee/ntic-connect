import { seedData } from './seed'
import type { UserRole } from '../auth/roles'

export type AnnouncementTarget =
  | 'tous'
  | 'filiere'
  | 'formateurs'
  | 'stagiaires'

export type Announcement = {
  id: string
  title: string
  body: string
  target: AnnouncementTarget
  targetFiliere?: string
  publishedBy: string
  createdAt: string
  readBy: string[]
}

export type LessonFormat = 'Cours' | 'Support' | 'Travaux pratiques'

export type Lesson = {
  id: string
  title: string
  subject: string
  filiere: string
  section: string
  trainer: string
  format: LessonFormat
  fileName: string
  fileSize: string
  createdAt: string
}

export type RequestType =
  | 'Attestation de scolarité'
  | 'Information administrative'
  | 'Problème d’équipement'
  | 'Suggestion'
  | 'Réclamation'

export type RequestStatus =
  | 'envoyee'
  | 'en_verification'
  | 'en_traitement'
  | 'traitee'
  | 'refusee'

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  envoyee: 'Envoyée',
  en_verification: 'En cours de vérification',
  en_traitement: 'En traitement',
  traitee: 'Traitée',
  refusee: 'Refusée',
}

export type RequestHistoryEntry = {
  id: string
  status: RequestStatus
  actorName: string
  actorRole: UserRole
  note?: string
  reason?: string
  createdAt: string
}

export type AdministrativeRequest = {
  id: string
  ownerId: string
  ownerName: string
  filiere: string
  type: RequestType
  details: string
  status: RequestStatus
  refusalReason?: string
  internalNote?: string
  createdAt: string
  updatedAt: string
  history: RequestHistoryEntry[]
}

export type Notification = {
  id: string
  recipientRole: UserRole
  recipientUserId?: string
  recipientFiliere?: string
  title: string
  message: string
  createdAt: string
  read: boolean
  href?: string
}

export type Club = {
  id: string
  name: string
  category: string
  description: string
  managerId: string
  managerName: string
  memberCount: number
}

export type ClubEvent = {
  id: string
  clubId: string
  title: string
  startsAt: string
  location: string
  description: string
  capacity: number
  createdAt: string
}

export type Registration = {
  id: string
  eventId: string
  userId: string
  userName: string
  registeredAt: string
}

export type AppDatabase = {
  announcements: Announcement[]
  lessons: Lesson[]
  requests: AdministrativeRequest[]
  notifications: Notification[]
  clubs: Club[]
  events: ClubEvent[]
  registrations: Registration[]
}

const STORAGE_KEY = 'ntic-connect:data:v1'
const COLLECTION_KEYS: (keyof AppDatabase)[] = [
  'announcements',
  'lessons',
  'requests',
  'notifications',
  'clubs',
  'events',
  'registrations',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasCollectionIds(value: unknown): value is AppDatabase {
  if (!isRecord(value)) return false
  return COLLECTION_KEYS.every((key) => {
    const collection = value[key]
    return (
      Array.isArray(collection) &&
      collection.every(
        (item) => isRecord(item) && typeof item.id === 'string',
      )
    )
  })
}

function cloneSeedData(): AppDatabase {
  return structuredClone(seedData)
}

export function loadDatabase(): AppDatabase {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === null) return cloneSeedData()

  try {
    const parsed: unknown = JSON.parse(stored)
    if (
      isRecord(parsed) &&
      parsed.version === 1 &&
      hasCollectionIds(parsed.data)
    ) {
      return parsed.data
    }
  } catch (error) {
    console.error('Les données de démonstration enregistrées sont illisibles.', error)
  }

  console.error('Les données de démonstration enregistrées sont invalides.')
  window.localStorage.removeItem(STORAGE_KEY)
  return cloneSeedData()
}

export function saveDatabase(database: AppDatabase): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, data: database }),
  )
}

export function resetDatabase(): AppDatabase {
  window.localStorage.removeItem(STORAGE_KEY)
  return cloneSeedData()
}
