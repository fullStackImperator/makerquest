'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function deleteAttachment(
  courseId: string,
  attachmentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user?.isTeacher) {
      return { success: false, error: 'Unauthorized' }
    }

    const courseOwner = await db.course.findUnique({
      where: { id: courseId, userId: user.id },
    })

    if (!courseOwner) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.attachment.delete({
      where: { courseId, id: attachmentId },
    })

    return { success: true }
  } catch (error) {
    console.error('[DELETE_ATTACHMENT]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
