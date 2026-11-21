import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  resetDatabase,
  loadDatabase,
  saveDatabase,
  REQUEST_STATUS_LABELS,
  type AdministrativeRequest,
  type Announcement,
  type ClubEvent,
  type Lesson,
  type Notification,
  type Registration,
  type RequestHistoryEntry,
} from './db'
import type { AuthUser, UserRole } from '../auth/roles'
import { USER_ROLES } from '../auth/roles'
import {
  DataContext,
  type DataContextValue,
  type NewAnnouncement,
  type NewEvent,
  type NewLesson,
  type Recipient,
} from './context'

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function nextRequestNumber(requests: AdministrativeRequest[]): number {
  return requests.reduce((next, request) => {
    const match = /^REQ-\d{4}-(\d+)$/.exec(request.id)
    return match ? Math.max(next, Number(match[1]) + 1) : next
  }, 1)
}

function makeNotification(
  recipient: Recipient,
  title: string,
  message: string,
  href?: string,
): Notification {
  return {
    id: createId('notification'),
    recipientRole: recipient.role,
    recipientUserId: recipient.userId,
    recipientFiliere: recipient.filiere,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    href,
  }
}

function announcementRecipients(announcement: NewAnnouncement): Recipient[] {
  if (announcement.target === 'tous') {
    return USER_ROLES.map((role) => ({ role }))
  }
  if (announcement.target === 'formateurs') return [{ role: 'formateur' }]
  if (announcement.target === 'stagiaires') return [{ role: 'stagiaire' }]
  if (!announcement.targetFiliere?.trim()) {
    throw new Error('Choisissez une filière pour cette annonce.')
  }
  return [
    { role: 'stagiaire', filiere: announcement.targetFiliere.trim() },
  ]
}

function notificationForAnnouncement(
  announcement: Announcement,
  recipient: Recipient,
): Notification {
  const hrefByRole: Record<UserRole, string> = {
    stagiaire: '/app/stagiaire/annonces',
    formateur: '/app/formateur/annonces',
    direction: '/app/direction/annonces',
    club: '/app/club',
  }
  return makeNotification(
    recipient,
    'Nouvelle annonce',
    announcement.title,
    hrefByRole[recipient.role],
  )
}

export default function DataProvider({ children }: { children: ReactNode }) {
  const [database, setDatabase] = useState(loadDatabase)
  const requestSequence = useRef(nextRequestNumber(database.requests))

  useEffect(() => {
    saveDatabase(database)
  }, [database])

  const resetData = () => {
    const initialData = resetDatabase()
    requestSequence.current = nextRequestNumber(initialData.requests)
    setDatabase(initialData)
  }

  const getAnnouncementsFor = (user: AuthUser) =>
    database.announcements.filter((announcement) => {
      if (user.role === 'direction' || announcement.target === 'tous') {
        return true
      }
      if (announcement.target === 'formateurs') {
        return user.role === 'formateur'
      }
      if (announcement.target === 'stagiaires') {
        return user.role === 'stagiaire'
      }
      return (
        user.role === 'stagiaire' &&
        user.filiere === announcement.targetFiliere
      )
    })

  const getLessonsFor = (user: AuthUser) =>
    user.role === 'stagiaire'
      ? database.lessons.filter((lesson) => lesson.filiere === user.filiere)
      : database.lessons

  const getNotificationsFor = (user: AuthUser) =>
    database.notifications
      .filter(
        (notification) =>
          notification.recipientRole === user.role &&
          (notification.recipientUserId === undefined ||
            notification.recipientUserId === user.id) &&
          (notification.recipientFiliere === undefined ||
            notification.recipientFiliere === user.filiere),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const addAnnouncement = (
    input: NewAnnouncement,
    actor: AuthUser,
  ): Announcement => {
    if (!input.title.trim() || !input.body.trim()) {
      throw new Error('Le titre et le texte de l’annonce sont obligatoires.')
    }

    const recipients = announcementRecipients(input)
    const announcement: Announcement = {
      id: createId('ann'),
      title: input.title.trim(),
      body: input.body.trim(),
      target: input.target,
      targetFiliere:
        input.target === 'filiere' ? input.targetFiliere?.trim() : undefined,
      publishedBy: actor.name,
      createdAt: new Date().toISOString(),
      readBy: [],
    }
    const notifications = recipients.map((recipient) =>
      notificationForAnnouncement(announcement, recipient),
    )

    setDatabase((current) => ({
      ...current,
      announcements: [announcement, ...current.announcements],
      notifications: [...notifications, ...current.notifications],
    }))
    return announcement
  }

  const deleteAnnouncement = (id: string) => {
    setDatabase((current) => ({
      ...current,
      announcements: current.announcements.filter(
        (announcement) => announcement.id !== id,
      ),
    }))
  }

  const markAnnouncementRead = (id: string, userId: string) => {
    setDatabase((current) => ({
      ...current,
      announcements: current.announcements.map((announcement) =>
        announcement.id === id && !announcement.readBy.includes(userId)
          ? { ...announcement, readBy: [...announcement.readBy, userId] }
          : announcement,
      ),
    }))
  }

  const addLesson = (input: NewLesson, actor: AuthUser): Lesson => {
    if (!input.title.trim() || !input.fileName.trim()) {
      throw new Error('Le titre et le nom du fichier sont obligatoires.')
    }

    const lesson: Lesson = {
      ...input,
      id: createId('lesson'),
      title: input.title.trim(),
      fileName: input.fileName.trim(),
      trainer: actor.name,
      createdAt: new Date().toISOString(),
    }
    const notification = makeNotification(
      { role: 'stagiaire', filiere: lesson.filiere },
      'Nouveau cours disponible',
      `Le cours « ${lesson.title} » est disponible dans la bibliothèque.`,
      '/app/stagiaire/bibliotheque',
    )

    setDatabase((current) => ({
      ...current,
      lessons: [lesson, ...current.lessons],
      notifications: [notification, ...current.notifications],
    }))
    return lesson
  }

  const updateLesson = (
    id: string,
    changes: Partial<Omit<Lesson, 'id' | 'createdAt'>>,
    actor: AuthUser,
  ) => {
    const existing = database.lessons.find((lesson) => lesson.id === id)
    if (!existing) throw new Error('Ce cours n’existe plus.')

    const updatedLesson = { ...existing, ...changes }
    const notification = makeNotification(
      { role: 'stagiaire', filiere: updatedLesson.filiere },
      'Cours mis à jour',
      `Le cours « ${updatedLesson.title} » a été modifié par ${actor.name}.`,
      '/app/stagiaire/bibliotheque',
    )
    setDatabase((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) =>
        lesson.id === id ? updatedLesson : lesson,
      ),
      notifications: [notification, ...current.notifications],
    }))
  }

  const deleteLesson = (id: string, actor: AuthUser) => {
    const lesson = database.lessons.find((item) => item.id === id)
    if (!lesson) throw new Error('Ce cours n’existe plus.')

    const notification = makeNotification(
      { role: 'stagiaire', filiere: lesson.filiere },
      'Cours retiré de la bibliothèque',
      `Le cours « ${lesson.title} » a été retiré par ${actor.name}.`,
      '/app/stagiaire/bibliotheque',
    )
    setDatabase((current) => ({
      ...current,
      lessons: current.lessons.filter((item) => item.id !== id),
      notifications: [notification, ...current.notifications],
    }))
  }

  const addRequest = (
    input: { type: AdministrativeRequest['type']; details: string },
    requester: AuthUser,
  ): AdministrativeRequest => {
    if (!input.details.trim()) {
      throw new Error('Ajoutez les détails de votre demande.')
    }

    const createdAt = new Date().toISOString()
    const year = new Date(createdAt).getFullYear()
    const id = `REQ-${year}-${String(requestSequence.current).padStart(4, '0')}`
    requestSequence.current += 1
    const request: AdministrativeRequest = {
      id,
      ownerId: requester.id,
      ownerName: requester.name,
      filiere: requester.filiere ?? 'Non renseignée',
      type: input.type,
      details: input.details.trim(),
      status: 'envoyee',
      createdAt,
      updatedAt: createdAt,
      history: [
        {
          id: createId('history'),
          status: 'envoyee',
          actorName: requester.name,
          actorRole: requester.role,
          createdAt,
        },
      ],
    }
    const notification = makeNotification(
      { role: 'direction' },
      'Nouvelle demande administrative',
      `${requester.name} a envoyé une demande : ${request.type}.`,
      `/app/direction/demandes/${request.id}`,
    )

    setDatabase((current) => ({
      ...current,
      requests: [request, ...current.requests],
      notifications: [notification, ...current.notifications],
    }))
    return request
  }

  const updateRequestStatus = (
    id: string,
    update: {
      status: AdministrativeRequest['status']
      refusalReason?: string
      internalNote?: string
    },
    actor: AuthUser,
  ) => {
    const request = database.requests.find((item) => item.id === id)
    if (!request) throw new Error('Cette demande n’existe plus.')
    if (update.status === 'refusee' && !update.refusalReason?.trim()) {
      throw new Error('Un motif est obligatoire pour refuser une demande.')
    }

    const createdAt = new Date().toISOString()
    const historyEntry: RequestHistoryEntry = {
      id: createId('history'),
      status: update.status,
      actorName: actor.name,
      actorRole: actor.role,
      note: update.internalNote?.trim() || undefined,
      reason:
        update.status === 'refusee'
          ? update.refusalReason?.trim()
          : undefined,
      createdAt,
    }
    const updatedRequest: AdministrativeRequest = {
      ...request,
      status: update.status,
      refusalReason:
        update.status === 'refusee'
          ? update.refusalReason?.trim()
          : undefined,
      internalNote: update.internalNote?.trim() || undefined,
      updatedAt: createdAt,
      history: [...request.history, historyEntry],
    }
    const notification = makeNotification(
      { role: 'stagiaire', userId: request.ownerId },
      'Mise à jour de votre demande',
      `La demande ${request.id} est maintenant « ${REQUEST_STATUS_LABELS[update.status]} ».`,
      `/app/stagiaire/demandes/${request.id}`,
    )

    setDatabase((current) => ({
      ...current,
      requests: current.requests.map((item) =>
        item.id === id ? updatedRequest : item,
      ),
      notifications: [notification, ...current.notifications],
    }))
  }

  const markNotificationRead = (id: string, userId: string) => {
    const notification = database.notifications.find((item) => item.id === id)
    if (
      !notification ||
      (notification.recipientUserId !== undefined &&
        notification.recipientUserId !== userId)
    ) {
      return
    }

    setDatabase((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    }))
  }

  const addEvent = (input: NewEvent, actor: AuthUser): ClubEvent => {
    if (!input.title.trim() || !input.location.trim()) {
      throw new Error('Le titre et le lieu de l’événement sont obligatoires.')
    }
    if (!database.clubs.some((club) => club.id === input.clubId)) {
      throw new Error('Le club sélectionné n’existe pas.')
    }

    const event: ClubEvent = {
      ...input,
      id: createId('event'),
      title: input.title.trim(),
      location: input.location.trim(),
      createdAt: new Date().toISOString(),
    }
    const notification = makeNotification(
      { role: 'stagiaire' },
      'Nouvel événement',
      `${actor.name} a publié « ${event.title} ».`,
      '/app/stagiaire/clubs',
    )
    setDatabase((current) => ({
      ...current,
      events: [event, ...current.events],
      notifications: [notification, ...current.notifications],
    }))
    return event
  }

  const updateEvent = (
    id: string,
    changes: Partial<Omit<ClubEvent, 'id' | 'clubId' | 'createdAt'>>,
    actor: AuthUser,
  ) => {
    const existing = database.events.find((event) => event.id === id)
    if (!existing) throw new Error('Cet événement n’existe plus.')

    const updatedEvent = { ...existing, ...changes }
    const notification = makeNotification(
      { role: 'stagiaire' },
      'Événement mis à jour',
      `L’événement « ${updatedEvent.title} » a été modifié par ${actor.name}.`,
      '/app/stagiaire/clubs',
    )
    setDatabase((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === id ? updatedEvent : event,
      ),
      notifications: [notification, ...current.notifications],
    }))
  }

  const deleteEvent = (id: string, actor: AuthUser) => {
    const event = database.events.find((item) => item.id === id)
    if (!event) throw new Error('Cet événement n’existe plus.')
    const registeredUsers = database.registrations.filter(
      (registration) => registration.eventId === id,
    )
    const notifications = registeredUsers.map((registration) =>
      makeNotification(
        { role: 'stagiaire', userId: registration.userId },
        'Événement annulé',
        `L’événement « ${event.title} » a été annulé par ${actor.name}.`,
        '/app/stagiaire/clubs',
      ),
    )
    setDatabase((current) => ({
      ...current,
      events: current.events.filter((event) => event.id !== id),
      registrations: current.registrations.filter(
        (registration) => registration.eventId !== id,
      ),
      notifications: [...notifications, ...current.notifications],
    }))
  }

  const registerForEvent = (
    eventId: string,
    user: AuthUser,
  ): Registration => {
    const event = database.events.find((item) => item.id === eventId)
    if (!event) throw new Error('Cet événement n’existe plus.')

    const existingRegistration = database.registrations.find(
      (registration) =>
        registration.eventId === eventId && registration.userId === user.id,
    )
    if (existingRegistration) return existingRegistration

    const participantCount = database.registrations.filter(
      (registration) => registration.eventId === eventId,
    ).length
    if (participantCount >= event.capacity) {
      throw new Error('Il n’y a plus de place pour cet événement.')
    }

    const registration: Registration = {
      id: createId('registration'),
      eventId,
      userId: user.id,
      userName: user.name,
      registeredAt: new Date().toISOString(),
    }
    const club = database.clubs.find((item) => item.id === event.clubId)
    const notification = club
      ? makeNotification(
          { role: 'club', userId: club.managerId },
          'Nouvelle inscription à un événement',
          `${user.name} s’est inscrit·e à « ${event.title} ».`,
          '/app/club/participants',
        )
      : null

    setDatabase((current) => ({
      ...current,
      registrations: [registration, ...current.registrations],
      notifications: notification
        ? [notification, ...current.notifications]
        : current.notifications,
    }))
    return registration
  }

  const value: DataContextValue = {
    ...database,
    resetData,
    getAnnouncementsFor,
    getLessonsFor,
    getNotificationsFor,
    addAnnouncement,
    deleteAnnouncement,
    markAnnouncementRead,
    addLesson,
    updateLesson,
    deleteLesson,
    addRequest,
    updateRequestStatus,
    markNotificationRead,
    addEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
