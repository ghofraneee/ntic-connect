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
  targetSection?: string
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
  internalNote?: string
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

export type ClubJoinRequest = {
  id: string
  clubId: string
  userId: string
  userName: string
  filiere?: string
  status: 'pending' | 'accepted' | 'refused'
  requestedAt: string
}

export type DirectionUser = {
  id: string
  name: string
  email: string
  role: UserRole
  filiere?: string
  active: boolean
}

export type Filiere = {
  id: string
  name: string
  color: string
}

export type DirectionSection = {
  id: string
  filiereId: string
  name: string
}

export type DirectionActivity = {
  id: string
  title: string
  kind: 'Club' | 'Établissement'
  startsAt: string
  location: string
  participants: number
  createdAt: string
}

export type AppDatabase = {
  announcements: Announcement[]
  lessons: Lesson[]
  requests: AdministrativeRequest[]
  notifications: Notification[]
  clubs: Club[]
  events: ClubEvent[]
  registrations: Registration[]
  clubJoinRequests: ClubJoinRequest[]
  directionUsers: DirectionUser[]
  filieres: Filiere[]
  directionSections: DirectionSection[]
  directionActivities: DirectionActivity[]
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
  'clubJoinRequests',
  'directionUsers',
  'filieres',
  'directionSections',
  'directionActivities',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasCollectionIds<T extends object>(
  value: unknown,
  keys: readonly string[],
): value is T {
  if (!isRecord(value)) return false
  return keys.every((key) => {
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
      parsed.version === 3 &&
      hasCollectionIds<AppDatabase>(parsed.data, COLLECTION_KEYS)
    ) {
      return parsed.data
    }
    if (
      isRecord(parsed) &&
      (parsed.version === 1 || parsed.version === 2) &&
      isRecord(parsed.data)
    ) {
      const seed = cloneSeedData()
      return {
        ...seed,
        ...(parsed.data as unknown as Partial<AppDatabase>),
      }
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
    JSON.stringify({ version: 3, data: database }),
  )
}

export function resetDatabase(): AppDatabase {
  window.localStorage.removeItem(STORAGE_KEY)
  return cloneSeedData()
}
