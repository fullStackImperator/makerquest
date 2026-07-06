'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { gradeAttempt } from '@/lib/grading'
import { awardExerciseXpIfEligible } from '@/lib/award-exercise-xp'
import { Prisma } from '@/generated/client'
import { headers } from 'next/headers'

export async function submitAttempt(
  attemptId: string,
): Promise<
  | { success: true; status: string }
  | { success: false; error: string }
> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const attempt = await db.exerciseAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
      include: {
        exercise: {
          include: {
            questions: { orderBy: { position: 'asc' } },
          },
        },
        responses: true,
      },
    })

    if (!attempt) {
      return { success: false, error: 'Versuch nicht gefunden' }
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Bereits abgegeben' }
    }

    const hdrs = await headers()
    const host = hdrs.get('host') ?? 'localhost:3000'
    const proto = hdrs.get('x-forwarded-proto') ?? 'http'
    const baseUrl = `${proto}://${host}`

    const result = await gradeAttempt(
      attempt.exercise.questions.map((q) => ({
        id: q.id,
        kind: q.kind,
        points: q.points,
        spec: q.spec,
        solution: q.solution,
      })),
      attempt.responses.map((r) => ({
        questionId: r.questionId,
        answer: r.answer,
      })),
      baseUrl,
    )

    await db.$transaction(async (tx) => {
      for (const graded of result.perQuestion) {
        await tx.exerciseResponse.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: graded.questionId,
            },
          },
          create: {
            attemptId,
            questionId: graded.questionId,
            answer: {},
            autoScore: graded.autoScore,
            finalScore: graded.finalScore,
            feedback: graded.feedback ?? Prisma.JsonNull,
            needsReview: graded.needsReview,
          },
          update: {
            autoScore: graded.autoScore,
            finalScore: graded.finalScore,
            feedback: graded.feedback ?? Prisma.JsonNull,
            needsReview: graded.needsReview,
          },
        })
      }

      await tx.exerciseAttempt.update({
        where: { id: attemptId },
        data: {
          status: result.status,
          submittedAt: new Date(),
          totalScore: result.totalScore,
          maxScore: result.maxScore,
        },
      })
    })

    if (result.status === 'GRADED') {
      await awardExerciseXpIfEligible(user.id, attempt.exerciseId)
    }

    return { success: true, status: result.status }
  } catch (error) {
    console.error('[SUBMIT_ATTEMPT]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
