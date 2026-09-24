'use server'

import { awardCourseExperiencePoints } from '@/lib/award-course-xp'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { getSessionUser } from '@/lib/get-session-user'

export const awardExperiencePoints = async ({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}): Promise<{ success: boolean }> => {
  const viewer = await getSessionUser()
  if (!viewer || !(await getCourseIfTeachable(courseId, viewer))) {
    return { success: false }
  }
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
