'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { awardExerciseXpIfEligible } from '@/lib/award-exercise-xp'
import { Prisma } from '@/generated/client'

export async function approveResponse(
  courseId: string,
  responseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user.id,
      isAdmin: user.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    const response = await db.exerciseResponse.findUnique({
      where: { id: responseId },
      include: {
        attempt: { include: { exercise: true } },
      },
    })

    if (!response || response.attempt.exercise.courseId !== courseId) {
      return { success: false, error: 'Nicht gefunden' }
    }

    const finalScore = response.autoScore ?? 0

    await db.exerciseResponse.update({
      where: { id: responseId },
      data: {
        finalScore,
        needsReview: false,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    await finalizeAttemptIfReady(response.attemptId)

    return { success: true }
  } catch (error) {
    console.error('[APPROVE_RESPONSE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}

export async function overrideResponse(
  courseId: string,
  responseId: string,
  finalScore: number,
  feedback?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user.id,
      isAdmin: user.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    const response = await db.exerciseResponse.findUnique({
      where: { id: responseId },
      include: {
        attempt: { include: { exercise: true } },
      },
    })

    if (!response || response.attempt.exercise.courseId !== courseId) {
      return { success: false, error: 'Nicht gefunden' }
    }

    await db.exerciseResponse.update({
      where: { id: responseId },
      data: {
        finalScore,
        feedback:
          feedback != null
            ? feedback
            : response.feedback === null
              ? Prisma.JsonNull
              : response.feedback,
        needsReview: false,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    await finalizeAttemptIfReady(response.attemptId)

    return { success: true }
  } catch (error) {
    console.error('[OVERRIDE_RESPONSE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}

async function finalizeAttemptIfReady(attemptId: string) {
  const attempt = await db.exerciseAttempt.findUnique({
    where: { id: attemptId },
    include: { responses: true, exercise: true },
  })

  if (!attempt) return

  const stillPending = attempt.responses.some((r) => r.needsReview)
  if (stillPending) return

  const totalScore = attempt.responses.reduce(
    (s, r) => s + (r.finalScore ?? r.autoScore ?? 0),
    0,
  )

  await db.exerciseAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'GRADED',
      totalScore,
    },
  })

  await awardExerciseXpIfEligible(attempt.userId, attempt.exerciseId)
}
