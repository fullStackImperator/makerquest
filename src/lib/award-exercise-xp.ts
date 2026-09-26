import { addFachExperience, adjustFachExperience } from '@/lib/award-course-xp'
import { db } from '@/lib/db'

/** xpReward × share of points; below the optional minimum score the attempt is settled without XP. */
function exerciseXp(
  xpReward: number,
  passingScore: number | null,
  attempt: { totalScore: number; maxScore: number },
) {
  const share = attempt.maxScore > 0 ? Math.min(1, attempt.totalScore / attempt.maxScore) : 1
  const passed = passingScore == null || attempt.totalScore >= passingScore
  return passed ? Math.round(xpReward * share) : 0
}

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

  const xp = exerciseXp(xpReward, passingScore, attempt)

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

/**
 * After a teacher changes a grade: brings XP that was already paid for this
 * attempt in line with the new points (can take XP back). No-op before payout.
 */
export async function resyncExerciseXp(userId: string, exerciseId: string): Promise<void> {
  const attempt = await db.exerciseAttempt.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
    select: {
      id: true,
      status: true,
      totalScore: true,
      maxScore: true,
      xpAwarded: true,
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
  if (!attempt?.xpAwardedAt || attempt.status !== 'GRADED') return

  const { xpReward, passingScore, course } = attempt.exercise
  const target = exerciseXp(xpReward, passingScore, attempt)
  const delta = target - attempt.xpAwarded
  if (delta === 0) return

  await db.$transaction(async (tx) => {
    // Guard on the old value so two concurrent regrades can't both apply their delta.
    const claimed = await tx.exerciseAttempt.updateMany({
      where: { id: attempt.id, xpAwarded: attempt.xpAwarded },
      data: { xpAwarded: target },
    })
    if (claimed.count === 0) return
    for (const fach of course.faecher) {
      await adjustFachExperience(userId, fach.id, delta, tx)
    }
  })
}
