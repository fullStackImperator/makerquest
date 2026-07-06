import { z } from 'zod'

const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
})

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'OPENAI_API_KEY not configured' },
      { status: 503 },
    )
  }

  const body = await req.json()
  const { rubric, exemplar, studentAnswer, maxPoints } = body as {
    rubric: string
    exemplar: string
    studentAnswer: string
    maxPoints: number
  }

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
          content: `Bewertungskriterien: ${rubric || 'Fachliche Richtigkeit'}
Musterantwort: ${exemplar || '(keine)'}
Schülerantwort: ${studentAnswer}
Max Punkte: ${maxPoints}
score: 0-${maxPoints}, feedback: kurz auf Deutsch, confidence: 0-1`,
        },
      ],
    }),
  })

  if (!res.ok) {
    return Response.json({ error: 'OpenAI request failed' }, { status: 502 })
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  const parsed = gradeSchema.parse(JSON.parse(content))
  return Response.json(parsed)
}
