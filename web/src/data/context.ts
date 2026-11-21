import { createContext } from 'react'
import type { AuthUser, UserRole } from '../auth/roles'
import type {
  AdministrativeRequest,
  Announcement,
  AnnouncementTarget,
  AppDatabase,
  ClubEvent,
  Lesson,
  Notification,
  Registration,
  RequestStatus,
  RequestType,
} from './db'

export type NewAnnouncement = {
  title: string
  body: string
  target: AnnouncementTarget
  targetFiliere?: string
}

export type NewLesson = Omit<Lesson, 'id' | 'createdAt' | 'trainer'>

export type NewEvent = Omit<ClubEvent, 'id' | 'createdAt'>

export type DataContextValue = AppDatabase & {
  resetData: () => void
  getAnnouncementsFor: (user: AuthUser) => Announcement[]
  getLessonsFor: (user: AuthUser) => Lesson[]
  getNotificationsFor: (user: AuthUser) => Notification[]
  addAnnouncement: (
    input: NewAnnouncement,
    actor: AuthUser,
  ) => Announcement
  deleteAnnouncement: (id: string) => void
  markAnnouncementRead: (id: string, userId: string) => void
  addLesson: (input: NewLesson, actor: AuthUser) => Lesson
  updateLesson: (
    id: string,
    changes: Partial<Omit<Lesson, 'id' | 'createdAt'>>,
    actor: AuthUser,
  ) => void
  deleteLesson: (id: string, actor: AuthUser) => void
  addRequest: (
    input: { type: RequestType; details: string },
    requester: AuthUser,
  ) => AdministrativeRequest
  updateRequestStatus: (
    id: string,
    update: {
      status: RequestStatus
      refusalReason?: string
      internalNote?: string
    },
    actor: AuthUser,
  ) => void
  markNotificationRead: (id: string, userId: string) => void
  addEvent: (input: NewEvent, actor: AuthUser) => ClubEvent
  updateEvent: (
    id: string,
    changes: Partial<Omit<ClubEvent, 'id' | 'clubId' | 'createdAt'>>,
    actor: AuthUser,
  ) => void
  deleteEvent: (id: string, actor: AuthUser) => void
  registerForEvent: (eventId: string, user: AuthUser) => Registration
}

export const DataContext = createContext<DataContextValue | null>(null)

export type Recipient = {
  role: UserRole
  userId?: string
  filiere?: string
}
