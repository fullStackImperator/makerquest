import type {
  FillBlankAnswer,
  FillBlankSolution,
  FillBlankSpec,
} from '@/lib/exercises/types'

function normalizeValue(
  value: string,
  caseSensitive: boolean,
  normalizeWhitespace: boolean,
): string {
  let v = value
  if (normalizeWhitespace) {
    v = v.trim().replace(/\s+/g, ' ')
  }
  if (!caseSensitive) {
    v = v.toLowerCase()
  }
  return v
}

function matchesBlank(
  studentValue: string,
  blank: FillBlankSpec['blanks'][0],
  canonical: string,
): boolean {
  const normalizedStudent = normalizeValue(
    studentValue,
    blank.caseSensitive,
    blank.normalizeWhitespace,
  )

  if (blank.regex) {
    try {
      const flags = blank.caseSensitive ? '' : 'i'
      return new RegExp(blank.regex, flags).test(studentValue)
    } catch {
      return false
    }
  }

  const accept = [
    canonical,
    ...blank.accept.filter((a) => a.trim().length > 0),
  ]

  return accept.some(
    (a) =>
      normalizeValue(a, blank.caseSensitive, blank.normalizeWhitespace) ===
      normalizedStudent,
  )
}

export function gradeFillBlank(
  spec: FillBlankSpec,
  solution: FillBlankSolution,
  answer: FillBlankAnswer | null | undefined,
  maxPoints: number,
): { score: number; correct: boolean } {
  if (!answer?.values || spec.blanks.length === 0) {
    return { score: 0, correct: false }
  }

  const perBlank = maxPoints / spec.blanks.length
  let earned = 0

  for (const blank of spec.blanks) {
    const studentVal = answer.values[blank.id] ?? ''
    const canonical = solution.values[blank.id] ?? ''
    if (matchesBlank(studentVal, blank, canonical)) {
      earned += perBlank
    }
  }

  const correct = earned >= maxPoints
  return { score: Math.round(earned), correct }
}
