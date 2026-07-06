'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getNextCourseItemPosition } from '@/lib/exercises/course-items'
import { headers } from 'next/headers'

export type CreateChapterResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function createChapter(
  courseId: string,
  payload: { title: string },
): Promise<CreateChapterResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { title } = payload

    if (!title?.trim()) {
      return { success: false, error: 'Titel ist erforderlich' }
    }

    const teachable = await getCourseIfTeachableBySession(courseId, session.user.id)
    if (!teachable) {
      return { success: false, error: 'Kurs nicht gefunden' }
    }

    const newPosition = await getNextCourseItemPosition(courseId)

    const chapter = await db.chapter.create({
      data: {
        title: title.trim(),
        courseId,
        position: newPosition,
      },
    })

    return { success: true, id: chapter.id }
  } catch (error) {
    console.error('[CREATE_CHAPTER]', error)
    return { success: false, error: 'Fehler beim Erstellen' }
  }
}
