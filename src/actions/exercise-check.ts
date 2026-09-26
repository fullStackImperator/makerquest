'use server'

import { revalidatePath } from 'next/cache'

import { Prisma } from '@/generated/client'
import { db } from '@/lib/db'
import { canAnswerExercise, recomputeAttempt, toQuestionState } from '@/lib/exercises/attempt'
import type { QuestionState } from '@/lib/exercises/public-question'
import type { QuestionAnswer } from '@/lib/exercises/types'
import { getSessionUser } from '@/lib/get-session-user'
import { gradeQuestion } from '@/lib/grading'
import { maybeCompleteLearningPathForCourse } from '@/lib/learning-path-complete-step'
import { notifyTeachersOfExerciseReview } from '@/lib/notifications'

export type CheckAnswerResult =
  | {
      success: true
      state: QuestionState
      /** Progress of the whole Aufgabe after this check. */
      progress: { checked: number; total: number; totalScore: number; maxScore: number; status: string } | null
    }
  | { success: false; error: string }

const MAX_ANSWER_BYTES = 20_000

/**
 * Grades one answer ("Prüfen"). Students may retry until correct; only the
 * first check determines the points. Short answers are submitted once and
 * wait for the teacher (AI only suggests points).
 */
export async function checkAnswer(questionId: string, answerJson: string): Promise<CheckAnswerResult> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }
  if (answerJson.length > MAX_ANSWER_BYTES) return { success: false, error: 'Antwort ist zu lang' }

  let answer: QuestionAnswer
  try {
    answer = JSON.parse(answerJson) as QuestionAnswer
  } catch {
    return { success: false, error: 'Ungültige Antwort' }
  }

  const question = await db.exerciseQuestion.findUnique({ where: { id: questionId } })
  if (!question || question.archivedAt) return { success: false, error: 'Frage nicht gefunden' }
  if (!(await canAnswerExercise(user.id, question.exerciseId))) {
    return { success: false, error: 'Diese Aufgabe ist für dich gesperrt' }
  }

  const attempt = await db.exerciseAttempt.upsert({
    where: { userId_exerciseId: { userId: user.id, exerciseId: question.exerciseId } },
    create: { userId: user.id, exerciseId: question.exerciseId },
    update: {},
    select: { id: true },
  })

  const existing = await db.exerciseResponse.findUnique({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
  })

  // Locked: already correct, or a short answer that was submitted.
  if (existing && existing.tries > 0 && (existing.correct || question.kind === 'SHORT_TEXT')) {
    return { success: true, state: toQuestionState(question, existing), progress: null }
  }

  const graded = await gradeQuestion(
    { id: question.id, kind: question.kind, points: question.points, spec: question.spec, solution: question.solution },
    answer,
    '',
  )

  const isShortText = question.kind === 'SHORT_TEXT'
  const firstTry = !existing || existing.tries === 0
  const now = new Date()

  const response = await db.exerciseResponse.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    create: {
      attemptId: attempt.id,
      questionId,
      answer: answer as Prisma.InputJsonValue,
      tries: 1,
      correct: isShortText ? null : graded.correct,
      checkedAt: now,
      // Short answers: AI only suggests (autoScore); the teacher decides.
      autoScore: graded.autoScore,
      firstTryScore: isShortText ? null : graded.autoScore,
      finalScore: isShortText ? null : graded.autoScore,
      needsReview: isShortText ? true : graded.needsReview,
      feedback: graded.feedback ?? Prisma.JsonNull,
    },
    update: {
      answer: answer as Prisma.InputJsonValue,
      tries: { increment: 1 },
      correct: isShortText ? null : graded.correct,
      // Points are fixed by the first check; later tries only update the result.
      ...(firstTry
        ? {
            checkedAt: now,
            autoScore: graded.autoScore,
            firstTryScore: isShortText ? null : graded.autoScore,
            finalScore: isShortText ? null : graded.autoScore,
            needsReview: isShortText ? true : graded.needsReview,
          }
        : {}),
      feedback: graded.feedback ?? Prisma.JsonNull,
    },
  })

  const progress = (await recomputeAttempt(attempt.id)) ?? null

  if (response.correct || isShortText) {
    const exercise = await db.exercise.findUnique({
      where: { id: question.exerciseId },
      select: { courseId: true },
    })
    if (exercise) {
      // Passing the quest's last Aufgabe can complete a Lernpfad step.
      await maybeCompleteLearningPathForCourse(user.id, exercise.courseId)
      if (firstTry && response.needsReview) {
        await notifyTeachersOfExerciseReview(user.id, exercise.courseId)
      }
    }
  }

  revalidatePath('/quests', 'layout')

  return { success: true, state: toQuestionState(question, response), progress }
}
