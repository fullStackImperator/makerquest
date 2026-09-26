'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import type { QuestionKind } from '@/generated/client'
import { defaultSpecAndSolution } from '@/lib/exercises/question-defaults'
import { EMPTY_LEXICAL_STATE } from '@/lib/lexical/defaults'

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
