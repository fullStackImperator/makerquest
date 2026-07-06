'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import type { QuestionKind } from '@/generated/client'
import type {
  DragDropSpec,
  DragDropSolution,
  FillBlankSpec,
  FillBlankSolution,
  MathSpec,
  MathSolution,
  McSingleSpec,
  McSingleSolution,
  ShortTextSpec,
} from '@/lib/exercises/types'
import { EMPTY_LEXICAL_STATE } from '@/lib/lexical/defaults'

function defaultSpecAndSolution(kind: QuestionKind): {
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
    default:
      return { spec: {}, solution: {} }
  }
}

export async function addQuestion(
  courseId: string,
  exerciseId: string,
  kind: QuestionKind,
): Promise<
  { success: true; id: string } | { success: false; error: string }
> {
  try {
    const user = await getSessionUser()
    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user.id,
      isAdmin: user.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    const last = await db.exerciseQuestion.findFirst({
      where: { exerciseId },
      orderBy: { position: 'desc' },
    })
    const position = (last?.position ?? 0) + 1
    const { spec, solution } = defaultSpecAndSolution(kind)

    const question = await db.exerciseQuestion.create({
      data: {
        exerciseId,
        kind,
        prompt: EMPTY_LEXICAL_STATE as object,
        spec,
        solution,
        position,
      },
    })

    return { success: true, id: question.id }
  } catch (error) {
    console.error('[ADD_QUESTION]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
