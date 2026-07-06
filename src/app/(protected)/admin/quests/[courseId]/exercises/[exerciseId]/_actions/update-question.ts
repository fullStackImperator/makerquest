'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { Prisma } from '@/generated/client'

export async function updateQuestion(
  courseId: string,
  exerciseId: string,
  questionId: string,
  data: {
    prompt?: string
    spec?: string
    solution?: string
    explanation?: string | null
    points?: number
  },
): Promise<{ success: true } | { success: false; error: string }> {
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

    const updateData: Prisma.ExerciseQuestionUpdateInput = {}

    if (data.prompt !== undefined) {
      updateData.prompt = JSON.parse(data.prompt) as Prisma.InputJsonValue
    }
    if (data.spec !== undefined) {
      updateData.spec = JSON.parse(data.spec) as Prisma.InputJsonValue
    }
    if (data.solution !== undefined) {
      updateData.solution = JSON.parse(data.solution) as Prisma.InputJsonValue
    }
    if (data.explanation !== undefined) {
      updateData.explanation =
        data.explanation === null
          ? Prisma.JsonNull
          : (JSON.parse(data.explanation) as Prisma.InputJsonValue)
    }
    if (data.points !== undefined) {
      updateData.points = data.points
    }

    await db.exerciseQuestion.update({
      where: { id: questionId, exerciseId },
      data: updateData,
    })

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_QUESTION]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
