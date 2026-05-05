import { db } from '@/lib/db'

/**
 * If the user is enrolled on a published path that includes this course,
 * they may only open the course when it is the current step.
 * Returns redirect path or null.
 */
export async function getLearningPathQuestBlockRedirect(
  userId: string,
  userSlug: string | null,
  courseId: string,
): Promise<string | null> {
  const steps = await db.learningPathStep.findMany({
    where: { courseId },
    include: {
      learningPath: {
        select: { id: true, slug: true, isPublished: true },
      },
    },
  })

  for (const step of steps) {
    if (!step.learningPath.isPublished) continue

    const enrollment = await db.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId: step.learningPathId,
        },
      },
    })

    if (!enrollment) continue

    if (enrollment.currentStepIndex !== step.position) {
      if (userSlug) {
        return `/lernpfade/${userSlug}/${step.learningPath.slug}`
      }
      return '/quests'
    }
  }

  return null
}
