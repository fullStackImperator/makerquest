'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

function fallbackNameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const seg = decodeURIComponent(
      u.pathname.split('/').filter(Boolean).pop() ?? '',
    )
    if (seg && seg.includes('.')) return seg
  } catch {
    /* ignore */
  }
  const tail = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
  return tail || 'Datei'
}

export async function addAttachment(
  courseId: string,
  url: string,
  fileName?: string | null,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const name =
      (typeof fileName === 'string' && fileName.trim()) ||
      fallbackNameFromUrl(url)

    await db.attachment.create({
      data: {
        url,
        name,
        courseId,
        userId: user.id,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[ADD_ATTACHMENT]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
