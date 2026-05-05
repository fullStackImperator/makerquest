'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function updateUserRoles(
  updateData: { userId: string; isTeacher: boolean }[],
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user?.isTeacher) {
      return { success: false, error: 'Unauthorized' }
    }

    for (const { userId, isTeacher } of updateData) {
      await db.user.update({
        where: { id: userId },
        data: { isTeacher },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_USER_ROLES]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
