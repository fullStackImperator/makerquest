'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function createFach(
  name: string,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const fach = await db.fach.create({
      data: { name },
    })

    return { success: true, id: fach.id }
  } catch (error) {
    console.error('[CREATE_FACH]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
