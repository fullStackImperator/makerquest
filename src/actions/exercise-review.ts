'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { Prisma } from '@/generated/client'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { resyncExerciseXp } from '@/lib/award-exercise-xp'
import { recomputeAttempt } from '@/lib/exercises/attempt'
import { getSessionUser } from '@/lib/get-session-user'
import {
  markExerciseReviewNotificationsRead,
  notifyStudentOfExerciseReview,
} from '@/lib/notifications'
import { logSecurityEvent } from '@/lib/security-log'

type ActionResult = { success: true } | { success: false; error: string }

const reviewSchema = z.object({
  courseId: z.string().min(1),
  responseId: z.string().min(1),
  score: z.number().int().min(0),
  feedback: z.string().max(2000),
})

/**
 * Grades a short answer waiting for review, or changes an earlier grade. The
 * teacher's points are the points that count; the attempt is recomputed, pays
 * its XP once complete, and XP already paid is corrected after a change.
 */
export async function reviewExerciseResponse(input: z.input<typeof reviewSchema>): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Ungültige Eingabe' }
  const { courseId, responseId, score, feedback } = parsed.data

  const user = await getSessionUser()
  const teachable = user ? await getCourseIfTeachable(courseId, user) : null
  if (!user || !teachable) {
    await logSecurityEvent('unauthorized-action', {
      action: 'exercise-review',
      userId: user?.id ?? null,
      courseId,
    })
    return { success: false, error: 'Keine Berechtigung' }
  }

  const response = await db.exerciseResponse.findUnique({
    where: { id: responseId },
    select: {
      attemptId: true,
      needsReview: true,
      reviewedAt: true,
      question: { select: { points: true } },
      attempt: { select: { userId: true, exerciseId: true, exercise: { select: { courseId: true } } } },
    },
  })
  if (!response || response.attempt.exercise.courseId !== courseId) {
    return { success: false, error: 'Antwort nicht gefunden' }
  }
  // Auto-graded answers (never reviewed) keep their first-try points.
  const regrade = !response.needsReview
  if (regrade && !response.reviewedAt) {
    return { success: false, error: 'Diese Antwort wurde automatisch bewertet' }
  }
  if (score > response.question.points) {
    return { success: false, error: `Höchstens ${response.question.points} Punkte` }
  }

  // A first review only applies while the answer is still open, so two teachers can't both grade it.
  const updated = await db.exerciseResponse.updateMany({
    where: regrade ? { id: responseId, reviewedAt: { not: null } } : { id: responseId, needsReview: true },
    data: {
      finalScore: score,
      firstTryScore: score,
      correct: score >= response.question.points,
      // Empty clears the AI text, so a fallback like "nicht verfügbar" never reaches the student.
      feedback: feedback.trim() || Prisma.JsonNull,
      needsReview: false,
      reviewedBy: user.id,
      reviewedAt: new Date(),
    },
  })
  if (updated.count === 0) return { success: false, error: 'Diese Antwort ist schon bewertet' }

  await recomputeAttempt(response.attemptId)
  if (regrade) await resyncExerciseXp(response.attempt.userId, response.attempt.exerciseId)

  const studentId = response.attempt.userId
  await notifyStudentOfExerciseReview(studentId, courseId, user.id)
  const stillPending = await db.exerciseResponse.count({
    where: {
      needsReview: true,
      question: { archivedAt: null },
      attempt: { userId: studentId, exercise: { courseId } },
    },
  })
  if (stillPending === 0) await markExerciseReviewNotificationsRead(studentId, courseId)

  revalidatePath('/admin/journal')
  revalidatePath(`/admin/quests/${courseId}`)
  revalidatePath(`/quests/${courseId}`, 'layout')
  return { success: true }
}
