'use server'

import { awardCourseExperiencePoints } from '@/lib/award-course-xp'

export const awardExperiencePoints = async ({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}): Promise<{ success: boolean }> => {
  try {
    const result = await awardCourseExperiencePoints(userId, courseId)
    if (!result.success) {
      throw new Error('Invalid course data')
    }
    return { success: true }
  } catch (error) {
    console.error('Error awarding experience points:', error)
    return { success: false }
  }
}
