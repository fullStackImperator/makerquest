import { db } from '@/lib/db'
import type { Prisma } from '@/generated/client'

const LEVEL_SCALE = 12

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

type DbCtx = Prisma.TransactionClient | typeof db

function ctx(c: DbCtx): DbCtx {
  return c
}

/**
 * Awards the same XP as teacher-triggered "Punkte vergeben" for a completed course
 * (once per fach per course via AwardedPoints).
 */
export async function awardCourseExperiencePoints(
  userId: string,
  courseId: string,
  dbx: DbCtx = db,
): Promise<{ success: boolean }> {
  try {
    const course = await ctx(dbx).course.findUnique({
      where: { id: courseId },
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
      return { success: false }
    }

    const difficultyMultiplier = getDifficultyMultiplier(course.schwierigkeit)
    const points = 10 * course.klassenstufe * difficultyMultiplier

    for (const fach of course.faecher) {
      const existingAward = await ctx(dbx).awardedPoints.findUnique({
        where: {
          userId_fachId_courseId: {
            userId,
            fachId: fach.id,
            courseId,
          },
        },
      })

      if (!existingAward) {
        const updatedExperience = await ctx(dbx).userFachExperience.upsert({
          where: {
            userId_fachId: {
              userId,
              fachId: fach.id,
            },
          },
          update: {
            experience: { increment: points },
          },
          create: {
            userId,
            fachId: fach.id,
            experience: points,
          },
        })

        const newLevel = Math.floor(
          Math.sqrt(updatedExperience.experience / LEVEL_SCALE),
        )

        await ctx(dbx).userFachExperience.update({
          where: {
            userId_fachId: {
              userId,
              fachId: fach.id,
            },
          },
          data: { level: newLevel },
        })

        await ctx(dbx).awardedPoints.create({
          data: {
            userId,
            fachId: fach.id,
            courseId,
            points,
          },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[awardCourseExperiencePoints]', error)
    return { success: false }
  }
}

/**
 * Adds flat bonus XP to the first Fach of a course (path step bonus).
 */
export async function awardBonusXpToCourseFirstFach(
  userId: string,
  courseId: string,
  bonusXp: number,
  dbx: DbCtx = db,
): Promise<void> {
  if (bonusXp <= 0) return

  const course = await ctx(dbx).course.findUnique({
    where: { id: courseId },
    select: {
      faecher: { select: { id: true }, take: 1 },
    },
  })

  const fachId = course?.faecher[0]?.id
  if (!fachId) return

  const updatedExperience = await ctx(dbx).userFachExperience.upsert({
    where: {
      userId_fachId: { userId, fachId },
    },
    update: {
      experience: { increment: bonusXp },
    },
    create: {
      userId,
      fachId,
      experience: bonusXp,
    },
  })

  const newLevel = Math.floor(
    Math.sqrt(updatedExperience.experience / LEVEL_SCALE),
  )

  await ctx(dbx).userFachExperience.update({
    where: { userId_fachId: { userId, fachId } },
    data: { level: newLevel },
  })
}
