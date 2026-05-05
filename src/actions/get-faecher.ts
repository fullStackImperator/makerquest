'use server'
// _actions/get-all-faecher.ts
import { db } from '@/lib/db'

export async function getAllFaecher() {
  return await db.fach.findMany({
    select: {
      id: true,
      name: true,
    },
  })
}
