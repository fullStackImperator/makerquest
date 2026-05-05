'use server'

import { db } from '@/lib/db'

export const revokeExperiencePoints = async ({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}): Promise<{ success: boolean }> => {
  try {
    // Fetch the course details to get klassenstufe and difficulty
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        klassenstufe: true,
        schwierigkeit: true,
        faecher: true,
      },
    })

    if (
      !course ||
      !course.klassenstufe ||
      !course.schwierigkeit ||
      course.faecher.length === 0
    ) {
      throw new Error('Invalid course data')
    }

    // Calculate the difficulty multiplier
    const difficultyMultiplier = getDifficultyMultiplier(course.schwierigkeit)

    // Calculate the experience points to revoke
    const points = 10 * course.klassenstufe! * difficultyMultiplier

    // Loop through each Fach associated with the course and revoke points
    for (const fach of course.faecher) {
      // Check if points have been awarded for this course and Fach
      const existingAward = await db.awardedPoints.findUnique({
        where: {
          userId_fachId_courseId: {
            userId,
            fachId: fach.id,
            courseId: courseId,
          },
        },
      })

      if (existingAward) {
        // Revoke points by decrementing the experience
        await db.userFachExperience.update({
          where: {
            userId_fachId: {
              userId,
              fachId: fach.id,
            },
          },
          data: {
            experience: {
              decrement: points,
            },
          },
        })

        // Remove the entry from AwardedPoints table
        await db.awardedPoints.delete({
          where: {
            id: existingAward.id,
          },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error revoking experience points:', error)
    return { success: false }
  }
}

// Helper function to map difficulty level to multiplier
function getDifficultyMultiplier(level: string): number {
  switch (level) {
    case 'VERY_EASY':
      return 1
    case 'EASY':
      return 2
    case 'MEDIUM':
      return 3
    case 'DIFFICULT':
      return 4
    case 'VERY_DIFFICULT':
      return 5
    default:
      throw new Error('Invalid difficulty level')
  }
}
