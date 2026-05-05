'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { Chapter, Prisma } from '@/generated/client'

type UpdateChapterData = Partial<
  Pick<
    Chapter,
    'title' | 'description' | 'isFree' | 'isPublished' | 'mathEditor'
  >
> & {
  mathEditor?: Prisma.InputJsonValue | null
}

export async function updateChapter(
  courseId: string,
  chapterId: string,
  data: UpdateChapterData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (!user.isTeacher && !user.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user.id,
      isAdmin: user.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    const prismaData: Prisma.ChapterUpdateInput =
      data.mathEditor === null
        ? { ...data, mathEditor: Prisma.JsonNull }
        : (data as Prisma.ChapterUpdateInput)

    await db.chapter.update({
      where: { id: chapterId, courseId },
      data: prismaData,
    })

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_CHAPTER]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
