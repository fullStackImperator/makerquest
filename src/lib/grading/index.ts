import type { QuestionKind } from '@/generated/client'
import type {
  DragDropAnswer,
  DragDropSolution,
  DragDropSpec,
  FillBlankAnswer,
  FillBlankSolution,
  FillBlankSpec,
  MathAnswer,
  MathSolution,
  MathSpec,
  McSingleAnswer,
  McSingleSolution,
  McSingleSpec,
  QuestionAnswer,
  ShortTextAnswer,
  ShortTextSpec,
} from '@/lib/exercises/types'
import { gradeDragDrop } from './drag-drop'
import { gradeFillBlank } from './fill-blank'
import { gradeMath } from './math'
import { gradeMcSingle } from './mc-single'
import { gradeShortTextAi } from './short-text-ai'

export type QuestionForGrading = {
  id: string
  kind: QuestionKind
  points: number
  spec: unknown
  solution: unknown
}

export type ResponseForGrading = {
  questionId: string
  answer: unknown
}

export type GradedQuestionResult = {
  questionId: string
  autoScore: number
  finalScore: number
  needsReview: boolean
  feedback: string | null
  correct: boolean
}

export type GradeAttemptResult = {
  perQuestion: GradedQuestionResult[]
  totalScore: number
  maxScore: number
  needsReviewIds: string[]
  status: 'GRADED' | 'NEEDS_REVIEW'
}

export async function gradeQuestion(
  question: QuestionForGrading,
  answer: QuestionAnswer | null | undefined,
  baseUrl: string,
): Promise<GradedQuestionResult> {
  const maxPoints = question.points

  switch (question.kind) {
    case 'MC_SINGLE': {
      const result = gradeMcSingle(
        question.solution as McSingleSolution,
        answer as McSingleAnswer,
        maxPoints,
      )
      return {
        questionId: question.id,
        autoScore: result.score,
        finalScore: result.score,
        needsReview: false,
        feedback: result.correct ? 'Richtig!' : 'Leider falsch.',
        correct: result.correct,
      }
    }
    case 'FILL_BLANK': {
      const result = gradeFillBlank(
        question.spec as FillBlankSpec,
        question.solution as FillBlankSolution,
        answer as FillBlankAnswer,
        maxPoints,
      )
      return {
        questionId: question.id,
        autoScore: result.score,
        finalScore: result.score,
        needsReview: false,
        feedback: result.correct ? 'Richtig!' : 'Nicht vollständig richtig.',
        correct: result.correct,
      }
    }
    case 'MATH': {
      const spec = question.spec as MathSpec
      const result = await gradeMath(
        question.solution as MathSolution,
        answer as MathAnswer,
        maxPoints,
        spec.tolerance,
      )
      return {
        questionId: question.id,
        autoScore: result.score,
        finalScore: result.score,
        needsReview: false,
        feedback: result.correct ? 'Richtig!' : 'Leider falsch.',
        correct: result.correct,
      }
    }
    case 'DRAG_DROP': {
      const result = gradeDragDrop(
        question.spec as DragDropSpec,
        question.solution as DragDropSolution,
        answer as DragDropAnswer,
        maxPoints,
      )
      return {
        questionId: question.id,
        autoScore: result.score,
        finalScore: result.score,
        needsReview: false,
        feedback: result.correct ? 'Richtig!' : 'Nicht vollständig richtig.',
        correct: result.correct,
      }
    }
    case 'SHORT_TEXT': {
      const ai = await gradeShortTextAi(
        question.spec as ShortTextSpec,
        answer as ShortTextAnswer,
        maxPoints,
        baseUrl,
      )
      return {
        questionId: question.id,
        autoScore: ai.score,
        finalScore: ai.needsReview ? 0 : ai.score,
        needsReview: ai.needsReview,
        feedback: ai.feedback,
        correct: ai.score >= maxPoints,
      }
    }
    default:
      return {
        questionId: question.id,
        autoScore: 0,
        finalScore: 0,
        needsReview: true,
        feedback: null,
        correct: false,
      }
  }
}

export async function gradeAttempt(
  questions: QuestionForGrading[],
  responses: ResponseForGrading[],
  baseUrl: string,
): Promise<GradeAttemptResult> {
  const answerMap = new Map(responses.map((r) => [r.questionId, r.answer]))

  const perQuestion = await Promise.all(
    questions.map((q) =>
      gradeQuestion(q, answerMap.get(q.id) as QuestionAnswer, baseUrl),
    ),
  )

  const needsReviewIds = perQuestion
    .filter((p) => p.needsReview)
    .map((p) => p.questionId)

  const totalScore = perQuestion.reduce((s, p) => s + p.finalScore, 0)
  const maxScore = questions.reduce((s, q) => s + q.points, 0)

  return {
    perQuestion,
    totalScore,
    maxScore,
    needsReviewIds,
    status: needsReviewIds.length > 0 ? 'NEEDS_REVIEW' : 'GRADED',
  }
}
