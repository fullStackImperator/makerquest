import type { QuestionKind } from '@/generated/client'
import type {
  DragDropSpec,
  DragDropSolution,
  FillBlankSpec,
  FillBlankSolution,
  H5pSpec,
  MathSpec,
  MathSolution,
  McSingleSpec,
  McSingleSolution,
  ShortTextSpec,
} from './types'

/** Starting spec/solution for a new question of the given kind. */
export function defaultSpecAndSolution(kind: QuestionKind): {
  spec: object
  solution: object
} {
  switch (kind) {
    case 'MC_SINGLE':
      return {
        spec: {
          options: [
            { id: 'a', label: 'Antwort A' },
            { id: 'b', label: 'Antwort B' },
          ],
          shuffle: true,
        } satisfies McSingleSpec,
        solution: { correctOptionId: 'a' } satisfies McSingleSolution,
      }
    case 'FILL_BLANK':
      return {
        spec: {
          blanks: [
            {
              id: 'b1',
              accept: [],
              caseSensitive: false,
              normalizeWhitespace: true,
            },
          ],
        } satisfies FillBlankSpec,
        solution: { values: { b1: '' } } satisfies FillBlankSolution,
      }
    case 'SHORT_TEXT':
      return {
        spec: {
          rubric: '',
          exemplar: '',
          maxLength: 500,
          autoFlagBelow: 0.8,
        } satisfies ShortTextSpec,
        solution: {},
      }
    case 'MATH':
      return {
        spec: { acceptable: [''], strict: false } satisfies MathSpec,
        solution: { acceptable: [''] } satisfies MathSolution,
      }
    case 'DRAG_DROP':
      return {
        spec: {
          mode: 'ordering',
          items: [
            { id: 'i1', label: 'Element 1' },
            { id: 'i2', label: 'Element 2' },
          ],
        } satisfies DragDropSpec,
        solution: { order: ['i1', 'i2'] } satisfies DragDropSolution,
      }
    case 'H5P':
      return {
        spec: {
          embedUrl: '',
          wpOrigin: '',
          height: 640,
        } satisfies H5pSpec,
        solution: {},
      }
    default:
      return { spec: {}, solution: {} }
  }
}
