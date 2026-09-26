import type { QuestionKind } from '@/generated/enums'
import type {
  DragDropSolution,
  DragDropSpec,
  FillBlankSpec,
  H5pAnswer,
  MathSolution,
  McSingleSolution,
  McSingleSpec,
} from './types'

/** Plain text of a Lexical JSON document (prompt, explanation). */
export function lexicalPlainText(doc: unknown): string {
  const parts: string[] = []
  const walk = (node: { text?: string; children?: unknown[] } | undefined) => {
    if (!node || typeof node !== 'object') return
    if (typeof node.text === 'string') parts.push(node.text)
    ;(node.children as (typeof node)[] | undefined)?.forEach(walk)
  }
  walk((doc as { root?: { children?: unknown[] } } | null)?.root)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export type AnswerDescription = {
  /** The student's answer, one line per part. */
  answer: string[]
  /** The expected answer, if the question has one. */
  expected: string[]
}

type Question = { kind: QuestionKind; spec: unknown; solution: unknown }

/** Readable form of a stored answer for the teacher's overview. Pure, safe on the client. */
export function describeAnswer(question: Question, answer: unknown): AnswerDescription {
  const a = (answer ?? {}) as Record<string, unknown>
  switch (question.kind) {
    case 'MC_SINGLE': {
      const spec = question.spec as McSingleSpec
      const solution = question.solution as McSingleSolution
      const label = (id: unknown) => spec.options?.find((o) => o.id === id)?.label ?? '—'
      return {
        answer: answer ? [label(a.optionId)] : [],
        expected: [label(solution?.correctOptionId)],
      }
    }
    case 'FILL_BLANK': {
      const spec = question.spec as FillBlankSpec
      const values = (a.values ?? {}) as Record<string, string>
      return {
        answer: answer ? spec.blanks.map((b, i) => `Lücke ${i + 1}: ${values[b.id]?.trim() || '—'}`) : [],
        expected: spec.blanks.map((b, i) => `Lücke ${i + 1}: ${b.accept.join(' / ') || '—'}`),
      }
    }
    case 'SHORT_TEXT':
      return { answer: typeof a.text === 'string' && a.text.trim() ? [a.text] : [], expected: [] }
    case 'MATH': {
      const solution = question.solution as MathSolution
      return {
        answer: typeof a.latex === 'string' && a.latex.trim() ? [a.latex] : [],
        expected: solution?.acceptable?.length ? [solution.acceptable.join(' / ')] : [],
      }
    }
    case 'DRAG_DROP': {
      const spec = question.spec as DragDropSpec
      const solution = question.solution as DragDropSolution
      const item = (id: string) => spec.items.find((i) => i.id === id)?.label ?? id
      const target = (id: string) => spec.targets?.find((t) => t.id === id)?.label ?? id
      const pairs = (p: Record<string, string>) =>
        Object.entries(p).map(([itemId, targetId]) => `${item(itemId)} → ${target(targetId)}`)
      const order = (ids: string[]) => ids.map((id, i) => `${i + 1}. ${item(id)}`)
      return {
        answer: !answer
          ? []
          : Array.isArray(a.order)
            ? order(a.order as string[])
            : pairs((a.pairs ?? {}) as Record<string, string>),
        expected: 'order' in solution ? order(solution.order) : pairs(solution.pairs),
      }
    }
    case 'H5P': {
      const h5p = a as Partial<H5pAnswer>
      return {
        answer: typeof h5p.scaled === 'number' ? [`${Math.round(h5p.scaled * 100)} % erreicht`] : [],
        expected: [],
      }
    }
    default:
      return { answer: [], expected: [] }
  }
}
