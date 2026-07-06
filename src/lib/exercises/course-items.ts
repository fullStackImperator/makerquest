import 'server-only'

import { db } from '@/lib/db'

export async function getNextCourseItemPosition(
  courseId: string,
): Promise<number> {
  const [lastChapter, lastExercise] = await Promise.all([
    db.chapter.findFirst({
      where: { courseId },
      orderBy: { position: 'desc' },
      select: { position: true },
    }),
    db.exercise.findFirst({
      where: { courseId },
      orderBy: { position: 'desc' },
      select: { position: true },
    }),
  ])

  const maxPos = Math.max(
    lastChapter?.position ?? 0,
    lastExercise?.position ?? 0,
  )
  return maxPos + 1
}
