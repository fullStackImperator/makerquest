import type {
  DragDropAnswer,
  DragDropSolution,
  DragDropSpec,
} from '@/lib/exercises/types'

export function gradeDragDrop(
  spec: DragDropSpec,
  solution: DragDropSolution,
  answer: DragDropAnswer | null | undefined,
  maxPoints: number,
): { score: number; correct: boolean } {
  if (!answer) {
    return { score: 0, correct: false }
  }

  if (spec.mode === 'ordering' && 'order' in solution) {
    const studentOrder = 'order' in answer ? answer.order : []
    const correct =
      studentOrder.length === solution.order.length &&
      studentOrder.every((id, i) => id === solution.order[i])
    return { score: correct ? maxPoints : 0, correct }
  }

  if (spec.mode === 'matching' && 'pairs' in solution) {
    const studentPairs = 'pairs' in answer ? answer.pairs : {}
    const keys = Object.keys(solution.pairs)
    if (keys.length === 0) {
      return { score: 0, correct: false }
    }
    const perPair = maxPoints / keys.length
    let earned = 0
    for (const itemId of keys) {
      if (studentPairs[itemId] === solution.pairs[itemId]) {
        earned += perPair
      }
    }
    const correct = earned >= maxPoints
    return { score: Math.round(earned), correct }
  }

  return { score: 0, correct: false }
}
