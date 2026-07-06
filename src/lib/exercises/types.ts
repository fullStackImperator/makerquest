import type { QuestionKind } from '@/generated/client'

export type CourseItemKind = 'chapter' | 'exercise'

export type CourseItem = {
  kind: CourseItemKind
  id: string
  title: string
  position: number
  isPublished: boolean
  isFree: boolean
}

export type McSingleSpec = {
  options: { id: string; label: string }[]
  shuffle: boolean
}

export type McSingleSolution = {
  correctOptionId: string
}

export type FillBlankSpec = {
  blanks: {
    id: string
    accept: string[]
    caseSensitive: boolean
    normalizeWhitespace: boolean
    regex?: string
  }[]
}

export type FillBlankSolution = {
  values: Record<string, string>
}

export type ShortTextSpec = {
  rubric: string
  exemplar: string
  maxLength: number
  autoFlagBelow?: number
  alwaysReview?: boolean
}

export type MathSpec = {
  acceptable: string[]
  tolerance?: number
  strict: boolean
}

export type MathSolution = {
  acceptable: string[]
}

export type DragDropSpec = {
  mode: 'matching' | 'ordering'
  items: { id: string; label: string }[]
  targets?: { id: string; label: string }[]
}

export type DragDropSolution =
  | { pairs: Record<string, string> }
  | { order: string[] }

export type McSingleAnswer = { optionId: string }
export type FillBlankAnswer = { values: Record<string, string> }
export type ShortTextAnswer = { text: string }
export type MathAnswer = { latex: string }
export type DragDropAnswer =
  | { pairs: Record<string, string> }
  | { order: string[] }

export type QuestionAnswer =
  | McSingleAnswer
  | FillBlankAnswer
  | ShortTextAnswer
  | MathAnswer
  | DragDropAnswer

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  MC_SINGLE: 'Multiple Choice',
  FILL_BLANK: 'Lückentext',
  SHORT_TEXT: 'Kurzantwort',
  MATH: 'Mathe',
  DRAG_DROP: 'Drag & Drop',
}

export const ATTEMPT_STATUS_LABELS = {
  IN_PROGRESS: 'In Bearbeitung',
  SUBMITTED: 'Eingereicht',
  NEEDS_REVIEW: 'Wird geprüft',
  GRADED: 'Bewertet',
} as const
