'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { UTApi } from 'uploadthing/server'

export async function deleteBadgeItem(
  id: string,
  imageUrl: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user?.isTeacher) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.badge.delete({ where: { id } })

    const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1)
    const utapi = new UTApi()
    await utapi.deleteFiles(filename)

    return { success: true }
  } catch (error) {
    console.error('[BADGE_DELETE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
