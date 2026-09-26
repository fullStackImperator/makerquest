'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { logSecurityEvent } from '@/lib/security-log'

export async function updateUserRoles(
  updateData: { userId: string; isTeacher: boolean }[],
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user?.isTeacher) {
      await logSecurityEvent('unauthorized-action', {
        action: 'update-user-roles',
        userId: user?.id ?? null,
        targets: updateData.map((u) => u.userId),
      })
      return { success: false, error: 'Unauthorized' }
    }

    for (const { userId, isTeacher } of updateData) {
      await db.user.update({
        where: { id: userId },
        // Deciding on the role also settles an open "Ich bin Lehrkraft" request.
        // A role assigned by staff also counts as approval.
        data: { isTeacher, teacherRequestedAt: null, approvedAt: new Date() },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_USER_ROLES]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
