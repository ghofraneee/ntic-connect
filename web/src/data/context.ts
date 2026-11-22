import { createContext } from 'react'
import type { AuthUser, UserRole } from '../auth/roles'
import type {
  AdministrativeRequest,
  Announcement,
  AnnouncementTarget,
  AppDatabase,
  ClubJoinRequest,
  ClubEvent,
  DirectionActivity,
  DirectionSection,
  DirectionUser,
  ScheduleSlot,
  ScheduleWeek,
  Filiere,
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
  targetSection?: string
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
  requestClubMembership: (
    clubId: string,
    user: AuthUser,
  ) => ClubJoinRequest
  resolveClubJoinRequest: (
    requestId: string,
    decision: 'accepted' | 'refused',
  ) => void
  removeClubMember: (requestId: string) => void
  addDirectionUser: (input: Omit<DirectionUser, 'id'>) => DirectionUser
  toggleDirectionUser: (id: string) => void
  addFiliere: (name: string, color?: string) => Filiere
  deleteFiliere: (id: string) => void
  addDirectionSection: (filiereId: string, name: string) => DirectionSection
  deleteDirectionSection: (id: string) => void
  addDirectionActivity: (
    input: Omit<DirectionActivity, 'id' | 'createdAt'>,
  ) => DirectionActivity
  deleteDirectionActivity: (id: string) => void
  saveScheduleWeek: (week: ScheduleWeek) => void
  deleteScheduleWeek: (id: string) => void
  addScheduleSlot: (weekId: string, slot: Omit<ScheduleSlot, 'id'>) => ScheduleSlot
  updateScheduleSlot: (
    weekId: string,
    slotId: string,
    changes: Partial<Omit<ScheduleSlot, 'id'>>,
  ) => void
  deleteScheduleSlot: (weekId: string, slotId: string) => void
}

export const DataContext = createContext<DataContextValue | null>(null)

export type Recipient = {
  role: UserRole
  userId?: string
  filiere?: string
}
