'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function createBadge(
  name: string,
  imageUrl: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user?.isTeacher) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.badge.create({
      data: { name, imageUrl },
    })

    return { success: true }
  } catch (error) {
    console.error('[BADGE_CREATE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
