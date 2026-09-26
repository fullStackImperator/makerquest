import 'server-only'

import { awardExerciseXpIfEligible } from '@/lib/award-exercise-xp'
import { db } from '@/lib/db'
import type { ExerciseQuestion, ExerciseResponse } from '@/generated/client'
import { explanationUnlocked, type QuestionState } from './public-question'
import { getCourseProgression } from './progression'
import type { QuestionAnswer } from './types'

/**
 * May the user answer questions of this exercise? Published exercise (or, for a
 * chapter's inline questions, a published chapter) and enrolled — or free.
 */
export async function canAnswerExercise(userId: string, exerciseId: string) {
  const exercise = await db.exercise.findUnique({
    where: { id: exerciseId },
    select: {
      courseId: true,
      chapterId: true,
      isPublished: true,
      isFree: true,
      chapter: { select: { isPublished: true, isFree: true } },
    },
  })
  if (!exercise) return false

  const published = exercise.chapter ? exercise.chapter.isPublished : exercise.isPublished
  if (!published) return false
  const free = exercise.chapter ? exercise.chapter.isFree : exercise.isFree
  if (!free) {
    const purchase = await db.purchase.findUnique({
      where: { userId_courseId: { userId, courseId: exercise.courseId } },
      select: { id: true },
    })
    if (!purchase) return false
  }

  // Not behind an Aufgabe that isn't passed yet.
  const { items } = await getCourseProgression(userId, exercise.courseId)
  const itemId = exercise.chapterId ?? exerciseId
  return !items.find((i) => i.id === itemId)?.lockedBy
}

/** The student-facing state of one question; hides AI feedback while a teacher still has to review. */
export function toQuestionState(
  question: Pick<ExerciseQuestion, 'explanation'>,
  response: ExerciseResponse | null | undefined,
): QuestionState {
  if (!response) {
    return { answer: null, tries: 0, correct: null, pending: false, points: null, feedback: null, explanation: null }
  }
  const reviewed = !!response.reviewedAt
  const pending = response.needsReview
  const unlocked = explanationUnlocked({
    correct: response.correct,
    pending,
    tries: response.tries,
    reviewed,
  })
  const feedback = typeof response.feedback === 'string' ? response.feedback : null
  return {
    answer: (response.answer as QuestionAnswer) ?? null,
    tries: response.tries,
    correct: response.correct,
    pending,
    points: pending ? null : (response.finalScore ?? response.firstTryScore),
    feedback: pending ? null : feedback,
    explanation: unlocked && !pending ? (question.explanation ?? null) : null,
  }
}

/**
 * Recalculates an attempt from its responses: complete once every active
 * question was checked; points = first-try points or the teacher's grade.
 * Pays the exercise XP when it becomes fully graded.
 */
export async function recomputeAttempt(attemptId: string) {
  const attempt = await db.exerciseAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      exerciseId: true,
      submittedAt: true,
      responses: true,
      exercise: {
        select: { questions: { where: { archivedAt: null }, select: { id: true, points: true } } },
      },
    },
  })
  if (!attempt) return

  const questions = attempt.exercise.questions
  const byQuestion = new Map(attempt.responses.map((r) => [r.questionId, r]))
  const checked = questions.filter((q) => (byQuestion.get(q.id)?.tries ?? 0) > 0)
  const complete = questions.length > 0 && checked.length === questions.length
  const needsReview = questions.some((q) => byQuestion.get(q.id)?.needsReview)

  const totalScore = questions.reduce((sum, q) => {
    const r = byQuestion.get(q.id)
    return sum + (r && !r.needsReview ? (r.finalScore ?? r.firstTryScore ?? 0) : 0)
  }, 0)
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0)

  const status = !complete ? 'IN_PROGRESS' : needsReview ? 'NEEDS_REVIEW' : 'GRADED'

  await db.exerciseAttempt.update({
    where: { id: attempt.id },
    data: {
      status,
      totalScore,
      maxScore,
      submittedAt: complete ? (attempt.submittedAt ?? new Date()) : attempt.submittedAt,
    },
  })

  if (status === 'GRADED') {
    await awardExerciseXpIfEligible(attempt.userId, attempt.exerciseId)
  }
  return { status, totalScore, maxScore, checked: checked.length, total: questions.length }
}
