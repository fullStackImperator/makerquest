import type { QuestionKind } from '@/generated/enums'
import type {
  DragDropSpec,
  FillBlankSpec,
  H5pSpec,
  McSingleSpec,
  QuestionAnswer,
  ShortTextSpec,
} from './types'
import { shuffleOptionsWithSeed } from './shuffle-options'

/** After this many attempts the explanation is shown even if still wrong. */
export const EXPLANATION_AFTER_TRIES = 3

/** Only what students need to answer — never solutions, accepted answers or model answers. */
export type PublicQuestionSpec =
  | { kind: 'MC_SINGLE'; spec: Pick<McSingleSpec, 'options' | 'shuffle'> }
  | { kind: 'FILL_BLANK'; spec: { blanks: { id: string }[] } }
  | { kind: 'SHORT_TEXT'; spec: Pick<ShortTextSpec, 'maxLength'> }
  | { kind: 'MATH'; spec: Record<string, never> }
  | { kind: 'DRAG_DROP'; spec: Pick<DragDropSpec, 'mode' | 'items' | 'targets'> }
  | { kind: 'H5P'; spec: H5pSpec }

export type PublicQuestion = PublicQuestionSpec & {
  id: string
  prompt: unknown
  points: number
  /** This question's share of the Aufgabe's XP (0 when the Aufgabe gives no XP). */
  xp: number
}

/** The student's state for one question, as shown in the question card. */
export type QuestionState = {
  answer: QuestionAnswer | null
  tries: number
  /** Result of the latest check; null before the first check. */
  correct: boolean | null
  /** Short answer waiting for the teacher. */
  pending: boolean
  /** Points that count (first try, or the teacher's grade). */
  points: number | null
  feedback: string | null
  /** Only sent once unlocked (correct, reviewed, or enough tries). */
  explanation: unknown | null
}

export function toPublicQuestion(
  q: {
    id: string
    kind: QuestionKind
    prompt: unknown
    points: number
    spec: unknown
  },
  /** The Aufgabe's XP reward and the total points of its active questions. */
  reward: { xpReward: number; maxPoints: number } = { xpReward: 0, maxPoints: 0 },
): PublicQuestion {
  const xp = reward.maxPoints > 0 ? Math.round((reward.xpReward * q.points) / reward.maxPoints) : 0
  const base = { id: q.id, prompt: q.prompt, points: q.points, xp }
  switch (q.kind) {
    case 'MC_SINGLE': {
      const s = q.spec as McSingleSpec
      return { ...base, kind: 'MC_SINGLE', spec: { options: s.options, shuffle: s.shuffle } }
    }
    case 'FILL_BLANK': {
      const s = q.spec as FillBlankSpec
      return { ...base, kind: 'FILL_BLANK', spec: { blanks: s.blanks.map((b) => ({ id: b.id })) } }
    }
    case 'SHORT_TEXT': {
      const s = q.spec as ShortTextSpec
      return { ...base, kind: 'SHORT_TEXT', spec: { maxLength: s.maxLength } }
    }
    case 'MATH':
      return { ...base, kind: 'MATH', spec: {} }
    case 'DRAG_DROP': {
      const s = q.spec as DragDropSpec
      // The stored item order is often the solution of an ordering task.
      let items = shuffleOptionsWithSeed(s.items, q.id)
      if (items.length > 1 && items.every((item, i) => item.id === s.items[i].id)) {
        items = [...items.slice(1), items[0]]
      }
      return { ...base, kind: 'DRAG_DROP', spec: { mode: s.mode, items, targets: s.targets } }
    }
    case 'H5P':
      return { ...base, kind: 'H5P', spec: q.spec as H5pSpec }
  }
}

/** Whether the explanation may be shown for this state. */
export function explanationUnlocked(state: { correct: boolean | null; pending: boolean; tries: number; reviewed: boolean }) {
  return state.correct === true || state.reviewed || state.tries >= EXPLANATION_AFTER_TRIES
}
