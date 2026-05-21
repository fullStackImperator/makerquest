'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

const courseSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
})

export async function addCourse(
  data: z.infer<typeof courseSchema>,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!user.isTeacher) {
      return { success: false, error: 'Unauthorized' }
    }

    const validation = courseSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: 'Ungültige Eingabe' }
    }

    const course = await db.course.create({
      data: {
        userId: user.id,
        title: validation.data.title,
      },
    })

    return { success: true, id: course.id }
  } catch (error) {
    console.error('[ADD_COURSE]', error)
    return { success: false, error: 'Kurs konnte nicht erstellt werden' }
  }
}
