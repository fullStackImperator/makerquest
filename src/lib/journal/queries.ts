import 'server-only'

import { db } from '@/lib/db'
import type { Prisma } from '@/generated/client'
import type {
  JournalEntryView,
  JournalQuestGroup,
  JournalQuestOption,
} from './shared'

export const journalEntryInclude = {
  course: { select: { title: true } },
  chapter: { select: { title: true } },
  attachments: { orderBy: { position: 'asc' } },
  events: {
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true } } },
  },
  _count: { select: { versions: true } },
} satisfies Prisma.JournalEntryInclude

type JournalEntryWithRelations = Prisma.JournalEntryGetPayload<{
  include: typeof journalEntryInclude
}>

export function toJournalEntryView(
  entry: JournalEntryWithRelations,
): JournalEntryView {
  return {
    id: entry.id,
    courseId: entry.courseId,
    courseTitle: entry.course.title,
    chapterId: entry.chapterId,
    chapterTitle: entry.chapter?.title ?? null,
    title: entry.title,
    content: entry.content,
    status: entry.status,
    entryDate: entry.entryDate.toISOString(),
    submittedAt: entry.submittedAt?.toISOString() ?? null,
    versionCount: entry._count.versions,
    attachments: entry.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      fileKey: a.fileKey,
      name: a.name,
      mimeType: a.mimeType,
      size: a.size,
    })),
    events: entry.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      body: e.body,
      createdAt: e.createdAt.toISOString(),
      authorName:
        e.author.name?.trim() || (e.author.id === entry.userId ? 'Schüler' : 'Lehrkraft'),
      authorIsStudent: e.author.id === entry.userId,
    })),
  }
}

/** The student's final assessment for a quest, once a teacher has set an overall level. */
export async function getStudentFinalGrade(userId: string, courseId: string) {
  const assessment = await db.finalAssessment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: {
      overallLevel: true,
      comment: true,
      gradedAt: true,
      gradedBy: { select: { name: true } },
      scores: {
        select: {
          level: true,
          criterion: { select: { label: true, description: true, position: true } },
        },
      },
    },
  })
  if (!assessment?.overallLevel || !assessment.gradedAt) return null

  return {
    overallLevel: assessment.overallLevel,
    comment: assessment.comment,
    gradedAt: assessment.gradedAt.toISOString(),
    gradedByName: assessment.gradedBy?.name?.trim() || 'Lehrkraft',
    scores: assessment.scores
      .sort((a, b) => a.criterion.position - b.criterion.position)
      .map((s) => ({
        label: s.criterion.label,
        description: s.criterion.description,
        level: s.level,
      })),
  }
}

export type StudentFinalGrade = NonNullable<Awaited<ReturnType<typeof getStudentFinalGrade>>>

export async function isEnrolledInCourse(userId: string, courseId: string) {
  const purchase = await db.purchase.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  return !!purchase
}

/** A student's own entries, oldest first; optionally limited to one quest. */
export async function getStudentJournalEntries(
  userId: string,
  courseId?: string,
): Promise<JournalEntryView[]> {
  const entries = await db.journalEntry.findMany({
    where: { userId, ...(courseId ? { courseId } : {}) },
    include: journalEntryInclude,
    orderBy: { entryDate: 'asc' },
  })
  return entries.map(toJournalEntryView)
}

export async function getStudentJournalEntry(userId: string, entryId: string) {
  const entry = await db.journalEntry.findFirst({
    where: { id: entryId, userId },
    include: journalEntryInclude,
  })
  return entry ? toJournalEntryView(entry) : null
}

/** Chapters a journal entry of this quest can be tagged with. */
export async function getJournalQuestOption(
  courseId: string,
): Promise<JournalQuestOption | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        select: { id: true, title: true },
      },
    },
  })
  return course
}

/**
 * Quests the student is enrolled in, grouped by the learning paths they are
 * enrolled in. Quests outside any enrolled path land in a group without title.
 */
export async function getJournalQuestGroups(
  userId: string,
): Promise<JournalQuestGroup[]> {
  const [purchases, pathEnrollments] = await Promise.all([
    db.purchase.findMany({
      where: { userId },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            chapters: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              select: { id: true, title: true },
            },
          },
        },
      },
    }),
    db.learningPathEnrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        learningPath: {
          select: {
            title: true,
            steps: {
              orderBy: { position: 'asc' },
              select: { courseId: true },
            },
          },
        },
      },
    }),
  ])

  const questsById = new Map(purchases.map((p) => [p.course.id, p.course]))
  const grouped = new Set<string>()
  const groups: JournalQuestGroup[] = []

  for (const { learningPath } of pathEnrollments) {
    const quests = learningPath.steps
      .map((s) => questsById.get(s.courseId))
      .filter((q): q is JournalQuestOption => !!q)
    if (quests.length === 0) continue
    quests.forEach((q) => grouped.add(q.id))
    groups.push({ learningPathTitle: learningPath.title, quests })
  }

  const ungrouped = [...questsById.values()]
    .filter((q) => !grouped.has(q.id))
    .sort((a, b) => a.title.localeCompare(b.title, 'de'))
  if (ungrouped.length > 0) {
    groups.push({ learningPathTitle: null, quests: ungrouped })
  }

  return groups
}
