'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { Prisma } from '@/generated/client'

export async function updateExercise(
  courseId: string,
  exerciseId: string,
  data: {
    title?: string
    intro?: string | null
    description?: string | null
    passingScore?: number | null
    awardXp?: boolean
    isFree?: boolean
  },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user.id,
      isAdmin: user.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    const updateData: Prisma.ExerciseUpdateInput = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.passingScore !== undefined) updateData.passingScore = data.passingScore
    if (data.awardXp !== undefined) updateData.awardXp = data.awardXp
    if (data.isFree !== undefined) updateData.isFree = data.isFree
    if (data.intro !== undefined) {
      updateData.intro =
        data.intro === null ? Prisma.JsonNull : (JSON.parse(data.intro) as Prisma.InputJsonValue)
    }

    await db.exercise.update({
      where: { id: exerciseId, courseId },
      data: updateData,
    })

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_EXERCISE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
