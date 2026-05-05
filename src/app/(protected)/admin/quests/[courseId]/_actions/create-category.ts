'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function createCategory(name: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
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
