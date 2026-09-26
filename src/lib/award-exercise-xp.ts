import { addFachExperience } from '@/lib/award-course-xp'
import { db } from '@/lib/db'

/**
 * Pays the Aufgabe's XP reward once the attempt is fully graded:
 * xpReward × share of points reached, to every Fach of the quest.
 * Runs at most once per attempt (guarded by xpAwardedAt).
 */
export async function awardExerciseXpIfEligible(
  userId: string,
  exerciseId: string,
): Promise<{ success: boolean; xp?: number }> {
  const attempt = await db.exerciseAttempt.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
    select: {
      id: true,
      status: true,
      totalScore: true,
      maxScore: true,
      xpAwardedAt: true,
      exercise: {
        select: {
          xpReward: true,
          passingScore: true,
          course: { select: { faecher: { select: { id: true } } } },
        },
      },
    },
  })
  if (!attempt || attempt.status !== 'GRADED' || attempt.xpAwardedAt) return { success: false }

  const { xpReward, passingScore, course } = attempt.exercise
  if (xpReward <= 0 || course.faecher.length === 0) return { success: false }

  const share = attempt.maxScore > 0 ? Math.min(1, attempt.totalScore / attempt.maxScore) : 1
  // Below the optional minimum score the attempt is settled without XP.
  const passed = passingScore == null || attempt.totalScore >= passingScore
  const xp = passed ? Math.round(xpReward * share) : 0

  return db.$transaction(async (tx) => {
    // Claim the award first so two concurrent calls can't both pay out.
    const claimed = await tx.exerciseAttempt.updateMany({
      where: { id: attempt.id, xpAwardedAt: null },
      data: { xpAwardedAt: new Date(), xpAwarded: xp },
    })
    if (claimed.count === 0) return { success: false }
    for (const fach of course.faecher) {
      await addFachExperience(userId, fach.id, xp, tx)
    }
    return { success: true, xp }
  })
}
