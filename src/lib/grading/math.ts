import type { MathAnswer, MathSolution } from '@/lib/exercises/types'

function normalizeLatex(s: string): string {
  return s.trim().replace(/\s+/g, '')
}

export async function gradeMath(
  solution: MathSolution,
  answer: MathAnswer | null | undefined,
  maxPoints: number,
  tolerance?: number,
): Promise<{ score: number; correct: boolean }> {
  if (!answer?.latex?.trim()) {
    return { score: 0, correct: false }
  }

  const student = normalizeLatex(answer.latex)
  const acceptable = solution.acceptable.map(normalizeLatex).filter(Boolean)

  if (acceptable.some((a) => a === student)) {
    return { score: maxPoints, correct: true }
  }

  if (tolerance != null && tolerance > 0) {
    const numStudent = parseFloat(student)
    if (!Number.isNaN(numStudent)) {
      for (const expr of acceptable) {
        const numExpected = parseFloat(expr)
        if (
          !Number.isNaN(numExpected) &&
          Math.abs(numStudent - numExpected) <= tolerance
        ) {
          return { score: maxPoints, correct: true }
        }
      }
    }
  }

  return { score: 0, correct: false }
}
