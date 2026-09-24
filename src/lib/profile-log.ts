import 'server-only'

import { db } from '@/lib/db'
import type { Prisma } from '@/generated/client'

export type ProfileField = 'name' | 'klasse' | 'image'
export type ProfileChangeSource = 'onboarding' | 'profile' | 'teacher'

type Snapshot = Partial<Record<ProfileField, string | null>>

/**
 * Records every field that differs between `before` and `after`.
 * Pass a transaction client to log atomically with the update.
 */
export async function logProfileChanges(
  {
    userId,
    actorId,
    source,
    before,
    after,
  }: {
    userId: string
    actorId: string
    source: ProfileChangeSource
    before: Snapshot
    after: Snapshot
  },
  dbx: Prisma.TransactionClient | typeof db = db,
) {
  const fields = (Object.keys(after) as ProfileField[]).filter(
    (field) => (before[field] ?? null) !== (after[field] ?? null),
  )
  if (fields.length === 0) return
  await dbx.profileChange.createMany({
    data: fields.map((field) => ({
      userId,
      actorId,
      source,
      field,
      oldValue: before[field] ?? null,
      newValue: after[field] ?? null,
    })),
  })
}

/** Records a rejected attempt to use a blocked name. Never throws. */
export async function logBlockedName(
  userId: string,
  attempted: string,
  currentName: string | null,
  source: ProfileChangeSource,
) {
  await db.profileChange
    .create({
      data: {
        userId,
        actorId: userId,
        source,
        field: 'name',
        oldValue: currentName,
        newValue: attempted.slice(0, 200),
        blocked: true,
      },
    })
    .catch((error) => console.error('[LOG_BLOCKED_NAME]', error))
}
