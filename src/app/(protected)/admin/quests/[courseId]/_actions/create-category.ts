'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function createCategory(name: string) {
  try {
    const user = await getSessionUser()

    if (!user?.isTeacher && !user?.isAdmin) {
      return { error: 'Unauthorized' }
    }

    const category = await db.category.create({
      data: { name },
    })

    return { data: category }
  } catch (error) {
    console.error('[Create Category]', error)
    return { error: 'Failed to create category' }
  }
}
