import 'server-only'

import { db } from '@/lib/db'
import type { AttemptStatus, QuestionKind } from '@/generated/enums'
import { describeAnswer, lexicalPlainText, type AnswerDescription } from './describe-answer'

/** Answers still waiting for a teacher, limited to enrolled students' attempts in these quests. */
const pendingWhere = (courseIds: string[]) => ({
  needsReview: true,
  question: { archivedAt: null },
  attempt: { exercise: { courseId: { in: courseIds } } },
})

/** Open short answers per quest. */
export async function countPendingReviewsByCourse(courseIds: string[]) {
  if (courseIds.length === 0) return new Map<string, number>()
  const pending = await db.exerciseResponse.findMany({
    where: pendingWhere(courseIds),
    select: { attempt: { select: { exercise: { select: { courseId: true } } } } },
  })
  const counts = new Map<string, number>()
  for (const p of pending) {
    const id = p.attempt.exercise.courseId
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

/** Open short answers per student in one quest. */
export async function countPendingReviewsByStudent(courseId: string) {
  const pending = await db.exerciseResponse.findMany({
    where: pendingWhere([courseId]),
    select: { attempt: { select: { userId: true } } },
  })
  const counts = new Map<string, number>()
  for (const p of pending) counts.set(p.attempt.userId, (counts.get(p.attempt.userId) ?? 0) + 1)
  return counts
}

/** AI fallback texts ("nicht verfügbar", "fehlgeschlagen") are not a real suggestion. */
function aiSuggestion(feedback: unknown, autoScore: number | null) {
  if (typeof feedback !== 'string' || /Ein Lehrer wird deine Antwort prüfen\.$/.test(feedback)) {
    return null
  }
  return { score: autoScore ?? 0, feedback }
}

export type TeacherQuestionView = {
  id: string
  /** The student's answer; null while unanswered. */
  responseId: string | null
  kind: QuestionKind
  points: number
  prompt: string
  tries: number
  /** Points that count: the teacher's grade or the first try; null while open or unanswered. */
  score: number | null
  correct: boolean | null
  needsReview: boolean
  reviewed: boolean
  /** Feedback the student sees (the teacher's once reviewed). */
  feedback: string | null
  ai: { score: number; feedback: string } | null
} & AnswerDescription

export type TeacherExerciseView = {
  id: string
  title: string
  /** Separate Aufgabe, or the questions inside a chapter. */
  source: 'exercise' | 'chapter'
  isPublished: boolean
  xpReward: number
  status: AttemptStatus | null
  totalScore: number
  maxScore: number
  xpAwarded: number | null
  questions: TeacherQuestionView[]
}

/** Every Aufgabe of the quest with this student's answers, in course order. */
export async function getStudentExercises(
  courseId: string,
  userId: string,
): Promise<TeacherExerciseView[]> {
  const exercises = await db.exercise.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      position: true,
      isPublished: true,
      xpReward: true,
      chapter: { select: { title: true, position: true, isPublished: true } },
      questions: { where: { archivedAt: null }, orderBy: { position: 'asc' } },
      attempts: { where: { userId }, include: { responses: true } },
    },
  })

  return exercises
    // Drafts and unpublished chapters only matter once the student has answers there.
    .filter((e) => e.questions.length > 0)
    .filter((e) => (e.chapter ? e.chapter.isPublished : e.isPublished) || e.attempts.length > 0)
    .sort((a, b) => (a.chapter?.position ?? a.position) - (b.chapter?.position ?? b.position))
    .map((e) => {
      const attempt = e.attempts[0]
      const responses = new Map((attempt?.responses ?? []).map((r) => [r.questionId, r]))
      const questions = e.questions.map((q): TeacherQuestionView => {
        const r = responses.get(q.id)
        const answered = !!r && r.tries > 0
        const described = describeAnswer(q, answered ? r.answer : null)
        return {
          id: q.id,
          responseId: r?.id ?? null,
          kind: q.kind,
          points: q.points,
          prompt: lexicalPlainText(q.prompt),
          tries: r?.tries ?? 0,
          score: answered && !r.needsReview ? (r.finalScore ?? r.firstTryScore ?? 0) : null,
          correct: r?.correct ?? null,
          needsReview: !!r?.needsReview,
          reviewed: !!r?.reviewedAt,
          feedback: typeof r?.feedback === 'string' ? r.feedback : null,
          // Once reviewed, feedback holds the teacher's text, not the AI's.
          ai: r?.needsReview && q.kind === 'SHORT_TEXT' ? aiSuggestion(r.feedback, r.autoScore) : null,
          ...described,
        }
      })
      return {
        id: e.id,
        title: e.chapter ? e.chapter.title : e.title,
        source: e.chapter ? 'chapter' : 'exercise',
        isPublished: e.chapter ? e.chapter.isPublished : e.isPublished,
        xpReward: e.xpReward,
        status: attempt?.status ?? null,
        totalScore: attempt?.totalScore ?? 0,
        maxScore: e.questions.reduce((sum, q) => sum + q.points, 0),
        xpAwarded: attempt?.xpAwardedAt ? attempt.xpAwarded : null,
        questions,
      }
    })
}

export type ExerciseSummary = {
  /** Aufgaben (separate or in chapters) with at least one question. */
  total: number
  /** Fully answered and graded. */
  graded: number
  pendingReview: number
  points: number
  maxPoints: number
  xp: number
}

/** Totals for the final-grade panel, derived from the same view as the tab. */
export function summarizeExercises(exercises: TeacherExerciseView[]): ExerciseSummary {
  const visible = exercises.filter((e) => e.isPublished)
  return {
    total: visible.length,
    graded: visible.filter((e) => e.status === 'GRADED').length,
    pendingReview: visible.reduce((n, e) => n + e.questions.filter((q) => q.needsReview).length, 0),
    points: visible.reduce((n, e) => n + e.totalScore, 0),
    maxPoints: visible.reduce((n, e) => n + e.maxScore, 0),
    xp: visible.reduce((n, e) => n + (e.xpAwarded ?? 0), 0),
  }
}
