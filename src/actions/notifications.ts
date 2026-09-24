'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { STUDENT_NOTIFICATION_KINDS, TEACHER_NOTIFICATION_KINDS } from '@/lib/notifications'
import type { NotificationKind } from '@/generated/enums'

export type NotificationItem = {
  id: string
  kind: NotificationKind
  title: string
  body: string | null
  href: string
  read: boolean
  createdAt: string
}

export type NotificationSummary = {
  items: NotificationItem[]
  unread: number
  /** Unread feedback on the student's own journal (menu badge "Journal"). */
  unreadJournal: number
  /** Unread submissions to review (menu badge "Admin"). */
  unreadReview: number
}

const EMPTY: NotificationSummary = { items: [], unread: 0, unreadJournal: 0, unreadReview: 0 }

/** Latest notifications and unread counts of the logged-in user. */
export async function getMyNotifications(): Promise<NotificationSummary> {
  const user = await getSessionUser()
  if (!user) return EMPTY

  const [items, unreadByKind] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, kind: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    db.notification.groupBy({
      by: ['kind'],
      where: { userId: user.id, readAt: null },
      _count: { _all: true },
    }),
  ])

  const count = (kinds: NotificationKind[]) =>
    unreadByKind.filter((u) => kinds.includes(u.kind)).reduce((sum, u) => sum + u._count._all, 0)

  return {
    items: items.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      read: !!n.readAt,
      createdAt: n.createdAt.toISOString(),
    })),
    unread: unreadByKind.reduce((sum, u) => sum + u._count._all, 0),
    unreadJournal: count(STUDENT_NOTIFICATION_KINDS),
    unreadReview: count(TEACHER_NOTIFICATION_KINDS),
  }
}

/** Longer history for the notifications page. */
export async function getMyNotificationHistory(): Promise<NotificationItem[]> {
  const user = await getSessionUser()
  if (!user) return []
  const items = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, kind: true, title: true, body: true, href: true, readAt: true, createdAt: true },
  })
  return items.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    href: n.href,
    read: !!n.readAt,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function markNotificationRead(id: string): Promise<void> {
  const user = await getSessionUser()
  if (!user) return
  await db.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await getSessionUser()
  if (!user) return
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })
}
