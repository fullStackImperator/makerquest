import 'server-only'

import { db } from '@/lib/db'
import type { NotificationKind } from '@/generated/enums'

/** Journal-related notification kinds a student receives. */
export const STUDENT_NOTIFICATION_KINDS: NotificationKind[] = [
  'JOURNAL_ACCEPTED',
  'JOURNAL_REVISION_REQUESTED',
  'JOURNAL_COMMENT',
  'JOURNAL_FINAL_GRADE',
]

/** Kinds that concern teachers (submissions to review). */
export const TEACHER_NOTIFICATION_KINDS: NotificationKind[] = [
  'JOURNAL_SUBMITTED',
  'JOURNAL_RESUBMITTED',
]

function displayName(name: string | null | undefined, fallback: string) {
  return name?.trim() || fallback
}

function entryLabel(title: string | null) {
  return `„${title?.trim() || 'Ohne Titel'}“`
}

function snippet(text: string | null | undefined, max = 140) {
  const t = text?.trim()
  if (!t) return null
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

/**
 * Tells the course owner and teachers the course is shared with that a
 * student submitted (or resubmitted) an entry. Never throws: a failed
 * notification must not fail the submission.
 */
export async function notifyTeachersOfSubmission(entryId: string, resubmission: boolean) {
  try {
    const entry = await db.journalEntry.findUnique({
      where: { id: entryId },
      select: {
        id: true,
        title: true,
        userId: true,
        courseId: true,
        user: { select: { name: true } },
        course: {
          select: { title: true, userId: true, sharedWith: { select: { id: true } } },
        },
      },
    })
    if (!entry) return

    const recipients = new Set([entry.course.userId, ...entry.course.sharedWith.map((u) => u.id)])
    recipients.delete(entry.userId)
    if (recipients.size === 0) return

    const student = displayName(entry.user.name, 'Ein Schüler')
    await db.notification.createMany({
      data: [...recipients].map((userId) => ({
        userId,
        actorId: entry.userId,
        kind: resubmission ? 'JOURNAL_RESUBMITTED' : 'JOURNAL_SUBMITTED',
        title: resubmission
          ? `${student} hat ${entryLabel(entry.title)} überarbeitet eingereicht`
          : `${student} hat ${entryLabel(entry.title)} eingereicht`,
        body: entry.course.title,
        href: `/admin/journal?course=${entry.courseId}&student=${entry.userId}#entry-${entry.id}`,
        courseId: entry.courseId,
        entryId: entry.id,
      })),
    })
  } catch (error) {
    console.error('[NOTIFY_TEACHERS]', error)
  }
}

/** Notifies the student about a teacher's reaction to one of their entries. */
export async function notifyStudentAboutEntry(
  entryId: string,
  kind: 'JOURNAL_ACCEPTED' | 'JOURNAL_REVISION_REQUESTED' | 'JOURNAL_COMMENT',
  actorId: string,
  comment?: string | null,
) {
  try {
    const [entry, actor] = await Promise.all([
      db.journalEntry.findUnique({
        where: { id: entryId },
        select: { id: true, title: true, userId: true, courseId: true, course: { select: { title: true } } },
      }),
      db.user.findUnique({ where: { id: actorId }, select: { name: true } }),
    ])
    if (!entry || entry.userId === actorId) return

    const teacher = displayName(actor?.name, 'Deine Lehrkraft')
    const label = entryLabel(entry.title)
    const title = {
      JOURNAL_ACCEPTED: `${label} wurde angenommen`,
      JOURNAL_REVISION_REQUESTED: `${label} soll überarbeitet werden`,
      JOURNAL_COMMENT: `${teacher} hat ${label} kommentiert`,
    }[kind]

    await db.notification.create({
      data: {
        userId: entry.userId,
        actorId,
        kind,
        title,
        body: snippet(comment) ?? `${teacher} · ${entry.course.title}`,
        href: `/journal?quest=${entry.courseId}#entry-${entry.id}`,
        courseId: entry.courseId,
        entryId: entry.id,
      },
    })
  } catch (error) {
    console.error('[NOTIFY_STUDENT]', error)
  }
}

export async function notifyStudentAboutFinalGrade(
  userId: string,
  courseId: string,
  actorId: string,
) {
  try {
    const course = await db.course.findUnique({ where: { id: courseId }, select: { title: true } })
    if (!course) return
    await db.notification.create({
      data: {
        userId,
        actorId,
        kind: 'JOURNAL_FINAL_GRADE',
        title: `Deine Abschlussbewertung für „${course.title}“ ist da`,
        href: `/journal?quest=${courseId}`,
        courseId,
      },
    })
  } catch (error) {
    console.error('[NOTIFY_FINAL_GRADE]', error)
  }
}

/** Once any teacher reviewed an entry, its submission notices are done for all teachers. */
export async function markSubmissionNotificationsRead(entryId: string) {
  await db.notification
    .updateMany({
      where: { entryId, kind: { in: TEACHER_NOTIFICATION_KINDS }, readAt: null },
      data: { readAt: new Date() },
    })
    .catch((error) => console.error('[MARK_SUBMISSION_READ]', error))
}
