'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { checkDisplayName } from '@/lib/name-policy'
import { formatKlasse, KLASSE_LETTER_OPTIONAL_FROM, KLASSENSTUFEN } from '@/lib/profile'
import { logSecurityEvent } from '@/lib/security-log'
import { logProfileChanges } from '@/lib/profile-log'

const schema = z.object({
  userId: z.string().min(1),
  /** Empty: the student has to enter a new name on their next visit. */
  name: z.string().max(200),
  stufe: z.number().int().nullable(),
  letter: z.string().trim().max(1),
  /** Optional notice shown to the student until they acknowledge it. */
  notice: z.string().trim().max(1000).optional(),
  /** Remove the avatar (e.g. an inappropriate picture). */
  removeImage: z.boolean().optional(),
})

/**
 * Teachers correct a student's name/Klasse (e.g. an inappropriate name).
 * Only admins may edit other teachers or admins.
 */
export async function updateUserProfile(
  input: z.input<typeof schema>,
): Promise<{ success: true } | { success: false; error: string }> {
  const viewer = await getSessionUser()
  const isStaff = viewer?.isTeacher === true || viewer?.isAdmin === true
  if (!viewer || !isStaff) {
    await logSecurityEvent('unauthorized-action', { action: 'update-user-profile', userId: viewer?.id ?? null })
    return { success: false, error: 'Keine Berechtigung' }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Ungültige Eingabe' }
  const { userId, stufe, letter, notice, removeImage } = parsed.data

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, klasse: true, image: true, isTeacher: true, isAdmin: true },
  })
  if (!target) return { success: false, error: 'Nutzer nicht gefunden' }
  const targetIsStaff = target.isTeacher === true || target.isAdmin === true
  if (targetIsStaff && viewer.isAdmin !== true) {
    return { success: false, error: 'Nur Admins können Lehrkräfte bearbeiten' }
  }

  let name = ''
  if (parsed.data.name.trim()) {
    const check = checkDisplayName(parsed.data.name)
    if (!check.ok) return { success: false, error: check.error }
    name = check.name
  }

  let klasse: string | null | undefined = undefined
  if (!targetIsStaff) {
    if (stufe === null) {
      klasse = null
    } else {
      if (!(KLASSENSTUFEN as readonly number[]).includes(stufe)) {
        return { success: false, error: 'Ungültige Klassenstufe' }
      }
      if (letter && !/^[a-z]$/i.test(letter)) {
        return { success: false, error: 'Der Klassenbuchstabe muss ein Buchstabe sein' }
      }
      if (!letter && stufe < KLASSE_LETTER_OPTIONAL_FROM) {
        return { success: false, error: 'Bitte gib den Klassenbuchstaben an' }
      }
      klasse = formatKlasse(stufe, letter)
    }
  }

  await db.$transaction(async (tx) => {
    const after = {
      name,
      ...(klasse !== undefined ? { klasse } : {}),
      ...(removeImage ? { image: null } : {}),
    }
    await tx.user.update({ where: { id: userId }, data: after })
    await logProfileChanges(
      {
        userId,
        actorId: viewer.id,
        source: 'teacher',
        before: { name: target.name, klasse: target.klasse, image: target.image },
        after,
      },
      tx,
    )
    if (notice) {
      await tx.notification.create({
        data: {
          userId,
          actorId: viewer.id,
          kind: 'ACCOUNT_NOTICE',
          title: 'Hinweis von deiner Lehrkraft',
          body: notice,
          href: '', // shown as a banner; nothing to navigate to
        },
      })
    }
  })

  revalidatePath('/admin/users')
  return { success: true }
}
