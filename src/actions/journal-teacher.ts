'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { revokeExperiencePoints } from '@/app/(protected)/admin/quests/[courseId]/grading/_actions/revoke-points'
import { Prisma } from '@/generated/client'
import { addFachExperience, awardCourseExperiencePoints } from '@/lib/award-course-xp'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { RUBRIC_LEVELS } from '@/lib/journal/shared'
import {
  markSubmissionNotificationsRead,
  notifyStudentAboutEntry,
  notifyStudentAboutFinalGrade,
} from '@/lib/notifications'

type ActionResult = { success: true } | { success: false; error: string }

const levelSchema = z.enum(RUBRIC_LEVELS as [string, ...string[]])

/** Session user, if they may teach the course (owner, shared teacher, admin). */
async function getTeacherForCourse(courseId: string) {
  const user = await getSessionUser()
  if (!user) return null
  const teachable = await getCourseIfTeachable(courseId, user)
  return teachable ? user : null
}

async function getTeacherForEntry(entryId: string) {
  const entry = await db.journalEntry.findUnique({
    where: { id: entryId },
    select: { id: true, courseId: true, userId: true, status: true },
  })
  if (!entry || entry.status === 'DRAFT') return null
  const teacher = await getTeacherForCourse(entry.courseId)
  return teacher ? { teacher, entry } : null
}

function revalidateWorkspace(courseId: string) {
  revalidatePath('/admin/journal')
  revalidatePath('/journal')
  revalidatePath(`/quests/${courseId}`, 'layout')
}

/** Calendar day in Berlin, used for the one-XP-entry-per-day-per-quest cap. */
function berlinDay(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(date)
}

export async function commentOnJournalEntry(
  entryId: string,
  body: string,
): Promise<ActionResult> {
  const text = body.trim()
  if (!text) return { success: false, error: 'Kommentar ist leer' }
  if (text.length > 5000) return { success: false, error: 'Kommentar ist zu lang' }

  const ctx = await getTeacherForEntry(entryId)
  if (!ctx) return { success: false, error: 'Keine Berechtigung' }

  await db.journalEvent.create({
    data: { entryId, authorId: ctx.teacher.id, kind: 'COMMENT', body: text },
  })
  await notifyStudentAboutEntry(entryId, 'JOURNAL_COMMENT', ctx.teacher.id, text)
  revalidateWorkspace(ctx.entry.courseId)
  return { success: true }
}

/**
 * Accepts an entry or asks for a revision, with an optional comment.
 * Accepting awards the course's journal XP once per entry, and at most for
 * one entry per student, quest and (Berlin) submission day.
 */
export async function reviewJournalEntry(
  entryId: string,
  decision: 'ACCEPTED' | 'REVISE',
  body?: string,
): Promise<ActionResult & { xpAwarded?: boolean }> {
  const text = body?.trim() || null
  if (text && text.length > 5000) return { success: false, error: 'Kommentar ist zu lang' }

  const ctx = await getTeacherForEntry(entryId)
  if (!ctx) return { success: false, error: 'Keine Berechtigung' }
  if (ctx.entry.status === decision) {
    return { success: false, error: 'Der Eintrag hat diesen Status bereits' }
  }

  try {
    const xpAwarded = await db.$transaction(
      async (tx) => {
        await tx.journalEntry.update({
          where: { id: entryId },
          data: { status: decision },
        })
        await tx.journalEvent.create({
          data: {
            entryId,
            authorId: ctx.teacher.id,
            kind: decision === 'ACCEPTED' ? 'ACCEPTED' : 'REVISION_REQUESTED',
            body: text,
          },
        })

        if (decision !== 'ACCEPTED') return false

        const entry = await tx.journalEntry.findUniqueOrThrow({
          where: { id: entryId },
          select: {
            userId: true,
            courseId: true,
            submittedAt: true,
            entryDate: true,
            xpAwardedAt: true,
            course: { select: { journalEntryXp: true, faecher: { select: { id: true } } } },
          },
        })
        if (entry.xpAwardedAt || entry.course.journalEntryXp <= 0) return false

        const day = berlinDay(entry.submittedAt ?? entry.entryDate)
        const rewarded = await tx.journalEntry.findMany({
          where: {
            userId: entry.userId,
            courseId: entry.courseId,
            xpAwardedAt: { not: null },
            id: { not: entryId },
          },
          select: { submittedAt: true, entryDate: true },
        })
        if (rewarded.some((r) => berlinDay(r.submittedAt ?? r.entryDate) === day)) {
          return false
        }

        for (const fach of entry.course.faecher) {
          await addFachExperience(entry.userId, fach.id, entry.course.journalEntryXp, tx)
        }
        await tx.journalEntry.update({
          where: { id: entryId },
          data: { xpAwardedAt: new Date() },
        })
        return entry.course.faecher.length > 0
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    await Promise.all([
      notifyStudentAboutEntry(
        entryId,
        decision === 'ACCEPTED' ? 'JOURNAL_ACCEPTED' : 'JOURNAL_REVISION_REQUESTED',
        ctx.teacher.id,
        text,
      ),
      markSubmissionNotificationsRead(entryId),
    ])
    revalidateWorkspace(ctx.entry.courseId)
    return { success: true, xpAwarded }
  } catch (error) {
    console.error('[REVIEW_JOURNAL_ENTRY]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen, bitte erneut versuchen' }
  }
}

const assessmentSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
  overallLevel: levelSchema.nullable(),
  comment: z.string().max(5000),
  scores: z.array(z.object({ criterionId: z.string().min(1), level: levelSchema })),
})

export async function saveFinalAssessment(
  input: z.input<typeof assessmentSchema>,
): Promise<ActionResult> {
  const parsed = assessmentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Ungültige Eingabe' }
  const data = parsed.data

  const teacher = await getTeacherForCourse(data.courseId)
  if (!teacher) return { success: false, error: 'Keine Berechtigung' }

  const [enrolled, criteria] = await Promise.all([
    db.purchase.findUnique({
      where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
      select: { id: true },
    }),
    db.rubricCriterion.findMany({ where: { courseId: data.courseId }, select: { id: true } }),
  ])
  if (!enrolled) return { success: false, error: 'Schüler ist nicht eingeschrieben' }
  const validIds = new Set(criteria.map((c) => c.id))
  const scores = data.scores.filter((s) => validIds.has(s.criterionId))

  const previous = await db.finalAssessment.findUnique({
    where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
    select: { overallLevel: true },
  })

  const fields = {
    overallLevel: data.overallLevel as Prisma.FinalAssessmentCreateInput['overallLevel'],
    comment: data.comment.trim() || null,
    gradedById: teacher.id,
    gradedAt: data.overallLevel ? new Date() : null,
  }

  await db.$transaction(async (tx) => {
    const assessment = await tx.finalAssessment.upsert({
      where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
      update: fields,
      create: { ...fields, userId: data.userId, courseId: data.courseId },
      select: { id: true },
    })
    await tx.rubricScore.deleteMany({ where: { assessmentId: assessment.id } })
    if (scores.length > 0) {
      await tx.rubricScore.createMany({
        data: scores.map((s) => ({
          assessmentId: assessment.id,
          criterionId: s.criterionId,
          level: s.level as Prisma.RubricScoreCreateManyInput['level'],
        })),
      })
    }
  })

  // Tell the student when the overall level is set for the first time or changes.
  if (data.overallLevel && data.overallLevel !== previous?.overallLevel) {
    await notifyStudentAboutFinalGrade(data.userId, data.courseId, teacher.id)
  }

  revalidateWorkspace(data.courseId)
  return { success: true }
}

/** Awards or revokes the quest's regular course XP (same XP as "Punkte vergeben"). */
export async function setCourseXp(
  courseId: string,
  userId: string,
  award: boolean,
): Promise<ActionResult> {
  const teacher = await getTeacherForCourse(courseId)
  if (!teacher) return { success: false, error: 'Keine Berechtigung' }

  const result = award
    ? await awardCourseExperiencePoints(userId, courseId)
    : await revokeExperiencePoints({ userId, courseId })
  if (!result.success) {
    return {
      success: false,
      error: 'XP konnten nicht geändert werden (Fach, Klassenstufe und Schwierigkeit gesetzt?)',
    }
  }

  revalidateWorkspace(courseId)
  return { success: true }
}

const rubricSchema = z.object({
  courseId: z.string().min(1),
  criteria: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300).optional(),
      }),
    )
    .min(1)
    .max(10),
})

/** Replaces the course rubric; removed criteria lose their scores. */
export async function saveRubric(input: z.input<typeof rubricSchema>): Promise<ActionResult> {
  const parsed = rubricSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Jedes Kriterium braucht einen Namen (max. 10 Kriterien)' }
  }
  const { courseId, criteria } = parsed.data

  const teacher = await getTeacherForCourse(courseId)
  if (!teacher) return { success: false, error: 'Keine Berechtigung' }

  await db.$transaction(async (tx) => {
    const keepIds = criteria.map((c) => c.id).filter((id): id is string => !!id)
    await tx.rubricCriterion.deleteMany({ where: { courseId, id: { notIn: keepIds } } })
    for (const [position, c] of criteria.entries()) {
      const fields = { label: c.label, description: c.description || null, position }
      if (c.id) {
        await tx.rubricCriterion.updateMany({ where: { id: c.id, courseId }, data: fields })
      } else {
        await tx.rubricCriterion.create({ data: { ...fields, courseId } })
      }
    }
  })

  revalidateWorkspace(courseId)
  return { success: true }
}
