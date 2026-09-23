import 'server-only'

import { db } from '@/lib/db'
import type { User } from '@/generated/client'
import type { RubricLevel } from '@/generated/enums'
import { journalEntryInclude, toJournalEntryView } from './queries'
import type { JournalAttachmentView, JournalEntryView } from './shared'

export const DEFAULT_RUBRIC = [
  { label: 'Dokumentation', description: 'Schritte nachvollziehbar festgehalten, mit Fotos und Erklärungen' },
  { label: 'Umsetzung', description: 'Technische Qualität und Funktion des Projekts' },
  { label: 'Kreativität', description: 'Eigene Ideen, Varianten und Lösungswege' },
  { label: 'Reflexion', description: 'Probleme, Lösungen und Gelerntes beschrieben' },
]

export type WorkspaceCourse = { id: string; title: string; readyCount: number }

export type WorkspaceStudentRow = {
  userId: string
  name: string
  klasse: string | null
  jahrgang: string | null
  enrolledAt: string
  chaptersCompleted: number
  chaptersTotal: number
  entryCount: number
  readyCount: number
  lastActivity: string | null
  finalLevel: RubricLevel | null
  isGraded: boolean
}

export type TeacherJournalEntryView = JournalEntryView & {
  versions: {
    version: number
    title: string | null
    content: unknown
    attachments: JournalAttachmentView[]
    createdAt: string
  }[]
}

/** Courses the viewer may teach: owned or shared; all courses for admins. */
export async function getWorkspaceCourses(
  viewer: Pick<User, 'id' | 'isAdmin'>,
): Promise<WorkspaceCourse[]> {
  const courses = await db.course.findMany({
    where: viewer.isAdmin
      ? {}
      : { OR: [{ userId: viewer.id }, { sharedWith: { some: { id: viewer.id } } }] },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  const ready = await db.journalEntry.groupBy({
    by: ['courseId'],
    where: { status: 'READY', courseId: { in: courses.map((c) => c.id) } },
    _count: { _all: true },
  })
  const readyByCourse = new Map(ready.map((r) => [r.courseId, r._count._all]))

  return courses.map((c) => ({ ...c, readyCount: readyByCourse.get(c.id) ?? 0 }))
}

/** One row per enrolled student, built with a fixed number of queries. */
export async function getWorkspaceStudents(courseId: string): Promise<WorkspaceStudentRow[]> {
  const [enrollments, chapters, entryCounts, lastSubmitted, assessments] = await Promise.all([
    db.purchase.findMany({
      where: { courseId },
      select: { userId: true, createdAt: true },
    }),
    db.chapter.findMany({
      where: { courseId, isPublished: true },
      select: { id: true },
    }),
    db.journalEntry.groupBy({
      by: ['userId', 'status'],
      where: { courseId, status: { not: 'DRAFT' } },
      _count: { _all: true },
    }),
    db.journalEntry.groupBy({
      by: ['userId'],
      where: { courseId, status: { not: 'DRAFT' } },
      _max: { submittedAt: true },
    }),
    db.finalAssessment.findMany({
      where: { courseId },
      select: { userId: true, overallLevel: true, gradedAt: true },
    }),
  ])

  const userIds = enrollments.map((e) => e.userId)
  const [users, progress] = await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, klasse: true, jahrgang: true },
    }),
    chapters.length > 0
      ? db.userProgress.groupBy({
          by: ['userId'],
          where: {
            userId: { in: userIds },
            chapterId: { in: chapters.map((c) => c.id) },
            isCompleted: true,
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ])

  const userById = new Map(users.map((u) => [u.id, u]))
  const progressByUser = new Map(progress.map((p) => [p.userId, p._count._all]))
  const lastByUser = new Map(lastSubmitted.map((l) => [l.userId, l._max.submittedAt]))
  const assessmentByUser = new Map(assessments.map((a) => [a.userId, a]))

  return enrollments.map((e) => {
    const user = userById.get(e.userId)
    const counts = entryCounts.filter((c) => c.userId === e.userId)
    const assessment = assessmentByUser.get(e.userId)
    return {
      userId: e.userId,
      name: user?.name ?? 'Unbekannt',
      klasse: user?.klasse ?? null,
      jahrgang: user?.jahrgang ?? null,
      enrolledAt: e.createdAt.toISOString(),
      chaptersCompleted: progressByUser.get(e.userId) ?? 0,
      chaptersTotal: chapters.length,
      entryCount: counts.reduce((sum, c) => sum + c._count._all, 0),
      readyCount: counts.find((c) => c.status === 'READY')?._count._all ?? 0,
      lastActivity: lastByUser.get(e.userId)?.toISOString() ?? null,
      finalLevel: assessment?.overallLevel ?? null,
      isGraded: !!assessment?.gradedAt,
    }
  })
}

/** Entries a teacher can see (everything except drafts), oldest first. */
export async function getTeacherJournalEntries(
  courseId: string,
  userId: string,
): Promise<TeacherJournalEntryView[]> {
  const entries = await db.journalEntry.findMany({
    where: { courseId, userId, status: { not: 'DRAFT' } },
    include: {
      ...journalEntryInclude,
      versions: { orderBy: { version: 'asc' } },
    },
    orderBy: { entryDate: 'asc' },
  })

  return entries.map((entry) => ({
    ...toJournalEntryView(entry),
    versions: entry.versions.map((v) => ({
      version: v.version,
      title: v.title,
      content: v.content,
      attachments: (v.attachments as JournalAttachmentView[] | null) ?? [],
      createdAt: v.createdAt.toISOString(),
    })),
  }))
}

/** The course's rubric; creates the default criteria on first use. */
export async function getOrCreateRubric(courseId: string) {
  const existing = await db.rubricCriterion.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
    select: { id: true, label: true, description: true },
  })
  if (existing.length > 0) return existing

  await db.rubricCriterion.createMany({
    data: DEFAULT_RUBRIC.map((c, position) => ({ ...c, courseId, position })),
  })
  return db.rubricCriterion.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
    select: { id: true, label: true, description: true },
  })
}

export async function getFinalAssessment(courseId: string, userId: string) {
  const [assessment, courseXp] = await Promise.all([
    db.finalAssessment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        scores: { select: { criterionId: true, level: true } },
        gradedBy: { select: { name: true } },
      },
    }),
    db.awardedPoints.findFirst({ where: { userId, courseId }, select: { id: true } }),
  ])

  return {
    overallLevel: assessment?.overallLevel ?? null,
    comment: assessment?.comment ?? '',
    gradedAt: assessment?.gradedAt?.toISOString() ?? null,
    gradedByName: assessment?.gradedBy?.name ?? null,
    scores: Object.fromEntries(
      (assessment?.scores ?? []).map((s) => [s.criterionId, s.level]),
    ) as Record<string, RubricLevel>,
    courseXpAwarded: !!courseXp,
  }
}

export type FinalAssessmentView = Awaited<ReturnType<typeof getFinalAssessment>>
export type RubricCriterionView = Awaited<ReturnType<typeof getOrCreateRubric>>[number]
