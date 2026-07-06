import type { ShortTextAnswer, ShortTextSpec } from '@/lib/exercises/types'

export type ShortTextGradeResult = {
  score: number
  feedback: string
  confidence: number
}

export async function gradeShortTextAi(
  spec: ShortTextSpec,
  answer: ShortTextAnswer | null | undefined,
  maxPoints: number,
  baseUrl: string,
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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      score: 0,
      feedback:
        'Automatische Bewertung nicht verfügbar. Ein Lehrer wird deine Antwort prüfen.',
      confidence: 0,
      needsReview: true,
    }
  }

  try {
    const res = await fetch(`${baseUrl}/api/ai/grade-short-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rubric: spec.rubric,
        exemplar: spec.exemplar,
        studentAnswer: text,
        maxPoints,
      }),
    })

    if (!res.ok) {
      throw new Error('AI grading failed')
    }

    const data = (await res.json()) as ShortTextGradeResult
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
