'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { UTApi } from 'uploadthing/server'

export async function updateBadge(
  id: string,
  name: string,
  imageUrl: string,
  oldImageUrl: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user?.isTeacher) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.badge.update({
      where: { id },
      data: { name, imageUrl },
    })

    const filename = oldImageUrl.substring(oldImageUrl.lastIndexOf('/') + 1)
    const utapi = new UTApi()
    await utapi.deleteFiles(filename)

    return { success: true }
  } catch (error) {
    console.error('[BADGE_UPDATE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
