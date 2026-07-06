import { awardCourseExperiencePoints } from '@/lib/award-course-xp'
import { db } from '@/lib/db'

export async function awardExerciseXpIfEligible(
  userId: string,
  exerciseId: string,
): Promise<{ success: boolean }> {
  const exercise = await db.exercise.findUnique({
    where: { id: exerciseId },
    select: {
      awardXp: true,
      passingScore: true,
      courseId: true,
    },
  })

  if (!exercise?.awardXp) {
    return { success: false }
  }

  const attempt = await db.exerciseAttempt.findUnique({
    where: {
      userId_exerciseId: { userId, exerciseId },
    },
  })

  if (!attempt || attempt.status !== 'GRADED') {
    return { success: false }
  }

  if (
    exercise.passingScore != null &&
    attempt.totalScore < exercise.passingScore
  ) {
    return { success: false }
  }

  return awardCourseExperiencePoints(userId, exercise.courseId)
}
