import type { ShortTextAnswer, ShortTextSpec } from '@/lib/exercises/types'
import { requestShortTextGrade } from '@/lib/ai/grade-short-text'

export type ShortTextGradeResult = {
  score: number
  feedback: string
  confidence: number
}

export async function gradeShortTextAi(
  spec: ShortTextSpec,
  answer: ShortTextAnswer | null | undefined,
  maxPoints: number,
  // kept for call compatibility; grading no longer goes through an HTTP route
  _baseUrl?: string,
): Promise<ShortTextGradeResult & { needsReview: boolean }> {
  const text = answer?.text?.trim() ?? ''
  const threshold = spec.autoFlagBelow ?? 0.8

  if (!text) {
    return {
      score: 0,
      feedback: 'Keine Antwort abgegeben.',
      confidence: 1,
      needsReview: spec.alwaysReview ?? false,
    }
  }

  try {
    const data = await requestShortTextGrade({
      rubric: spec.rubric,
      exemplar: spec.exemplar,
      studentAnswer: text,
      maxPoints,
    })
    if (!data) {
      return {
        score: 0,
        feedback:
          'Automatische Bewertung nicht verfügbar. Ein Lehrer wird deine Antwort prüfen.',
        confidence: 0,
        needsReview: true,
      }
    }

    const needsReview =
      (spec.alwaysReview ?? false) || data.confidence < threshold

    return { ...data, needsReview }
  } catch {
    return {
      score: 0,
      feedback:
        'Bewertung fehlgeschlagen. Ein Lehrer wird deine Antwort prüfen.',
      confidence: 0,
      needsReview: true,
    }
  }
}
