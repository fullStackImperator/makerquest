import type { McSingleAnswer, McSingleSolution } from '@/lib/exercises/types'

export function gradeMcSingle(
  solution: McSingleSolution,
  answer: McSingleAnswer | null | undefined,
  maxPoints: number,
): { score: number; correct: boolean } {
  if (!answer?.optionId) {
    return { score: 0, correct: false }
  }
  const correct = answer.optionId === solution.correctOptionId
  return { score: correct ? maxPoints : 0, correct }
}
