import { getProgress } from '@/actions/get-progress'
import {
  awardBonusXpToCourseFirstFach,
  awardCourseExperiencePoints,
} from '@/lib/award-course-xp'
import { db } from '@/lib/db'

/**
 * Call after chapter progress is saved. When the course reaches 100% for a user
 * enrolled on a learning path at the matching step, awards XP + step bonus,
 * advances the path, creates Purchases for the next quest, and awards the path
 * badge when the last quest is completed.
 */
export async function maybeCompleteLearningPathForCourse(
  userId: string,
  courseId: string,
): Promise<void> {
  const progress = await getProgress(userId, courseId)
  if (progress < 100) return

  const stepsForCourse = await db.learningPathStep.findMany({
    where: { courseId },
    include: {
      learningPath: {
        include: {
          steps: { orderBy: { position: 'asc' } },
        },
      },
    },
  })

  for (const step of stepsForCourse) {
    const path = step.learningPath
    const enrollment = await db.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId: path.id,
        },
      },
    })

    if (!enrollment) continue
    if (enrollment.currentStepIndex !== step.position) continue

    const already = await db.learningPathStepCompletion.findUnique({
      where: {
        userId_learningPathStepId: {
          userId,
          learningPathStepId: step.id,
        },
      },
    })
    if (already) continue

    const ordered = path.steps
    const lastStep = ordered[ordered.length - 1]
    const isLast =
      lastStep !== undefined && step.position === lastStep.position

    await db.$transaction(async (tx) => {
      await tx.learningPathStepCompletion.create({
        data: {
          userId,
          learningPathStepId: step.id,
        },
      })

      await awardCourseExperiencePoints(userId, courseId, tx)
      await awardBonusXpToCourseFirstFach(userId, courseId, step.bonusXp, tx)

      if (isLast) {
        await tx.learningPathCompletion.create({
          data: {
            userId,
            learningPathId: path.id,
          },
        })

        if (path.badgeId) {
          const has = await tx.userBadge.findFirst({
            where: { userId, badgeId: path.badgeId },
          })
          if (!has) {
            await tx.userBadge.create({
              data: { userId, badgeId: path.badgeId },
            })
          }
        }
      } else {
        const nextPos = step.position + 1
        await tx.learningPathEnrollment.update({
          where: {
            userId_learningPathId: {
              userId,
              learningPathId: path.id,
            },
          },
          data: { currentStepIndex: nextPos },
        })

        const nextStep = ordered.find((s) => s.position === nextPos)
        if (nextStep) {
          await tx.purchase.upsert({
            where: {
              userId_courseId: {
                userId,
                courseId: nextStep.courseId,
              },
            },
            create: {
              userId,
              courseId: nextStep.courseId,
            },
            update: {},
          })
        }
      }
    })
  }
}
