'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { Chapter, Prisma } from '@/generated/client'
import { syncInlineQuestions } from '@/lib/exercises/inline'

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
): Promise<
  | { success: true; content?: Prisma.InputJsonValue }
  | { success: false; error: string }
> {
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

    // "Aufgabe" blocks: archive removed questions, copy blocks from other chapters.
    let rewritten: Prisma.InputJsonValue | undefined
    if (data.mathEditor != null) {
      const parsed =
        typeof data.mathEditor === 'string' ? JSON.parse(data.mathEditor) : data.mathEditor
      const sync = await syncInlineQuestions(chapterId, parsed)
      if (sync.rewritten) {
        rewritten = sync.content as Prisma.InputJsonValue
        data = { ...data, mathEditor: JSON.stringify(rewritten) }
      }
    } else if (data.mathEditor === null) {
      await syncInlineQuestions(chapterId, null)
    }

    const prismaData: Prisma.ChapterUpdateInput =
      data.mathEditor === null
        ? { ...data, mathEditor: Prisma.JsonNull }
        : (data as Prisma.ChapterUpdateInput)

    await db.chapter.update({
      where: { id: chapterId, courseId },
      data: prismaData,
    })

    return { success: true, content: rewritten }
  } catch (error) {
    console.error('[UPDATE_CHAPTER]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
