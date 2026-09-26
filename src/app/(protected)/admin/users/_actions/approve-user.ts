'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { logSecurityEvent } from '@/lib/security-log'

/** Teachers and admins approve accounts that signed up without a school address. */
export async function approveUser(
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const viewer = await getSessionUser()
  if (!viewer || (viewer.isTeacher !== true && viewer.isAdmin !== true)) {
    await logSecurityEvent('unauthorized-action', {
      action: 'approve-user',
      userId: viewer?.id ?? null,
      target: userId,
    })
    return { success: false, error: 'Keine Berechtigung' }
  }

  const parsed = z.string().min(1).safeParse(userId)
  if (!parsed.success) return { success: false, error: 'Ungültige Eingabe' }

  const { count } = await db.user.updateMany({
    where: { id: parsed.data, approvedAt: null },
    data: { approvedAt: new Date() },
  })
  if (count === 0) return { success: false, error: 'Nutzer nicht gefunden oder bereits freigeschaltet' }

  await logSecurityEvent('user-approved', { userId: viewer.id, target: parsed.data })
  revalidatePath('/admin/users')
  return { success: true }
}
