import 'server-only'

import { z } from 'zod'

const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
})

export type AiShortTextGrade = z.infer<typeof gradeSchema>

/**
 * Asks OpenAI for a score suggestion. Only the answer text, rubric and
 * model answer are sent — never names or other personal data.
 * Returns null when no key is configured.
 */
export async function requestShortTextGrade(input: {
  rubric: string
  exemplar: string
  studentAnswer: string
  maxPoints: number
}): Promise<AiShortTextGrade | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein Lehrer. Antworte nur mit gültigem JSON: {"score": number, "feedback": string, "confidence": number}',
        },
        {
          role: 'user',
          content: `Bewertungskriterien: ${input.rubric || 'Fachliche Richtigkeit'}
Musterantwort: ${input.exemplar || '(keine)'}
Schülerantwort: ${input.studentAnswer.slice(0, 4000)}
Max Punkte: ${input.maxPoints}
score: 0-${input.maxPoints}, feedback: kurz auf Deutsch, confidence: 0-1`,
        },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`)

  const data = await res.json()
  const parsed = gradeSchema.parse(JSON.parse(data.choices?.[0]?.message?.content ?? '{}'))
  return { ...parsed, score: Math.min(parsed.score, input.maxPoints) }
}
