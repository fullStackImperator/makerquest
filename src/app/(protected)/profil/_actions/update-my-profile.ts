'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { isUploadThingUrl } from '@/lib/journal/shared'
import { checkDisplayName, isNameBlocked } from '@/lib/name-policy'
import { formatKlasse, KLASSE_LETTER_OPTIONAL_FROM, KLASSENSTUFEN } from '@/lib/profile'
import { logBlockedName, logProfileChanges } from '@/lib/profile-log'

const schema = z.object({
  name: z.string().max(200),
  stufe: z.number().int().nullable(),
  letter: z.string().trim().max(1),
  /** New avatar URL, null to remove it. */
  image: z.string().nullable(),
})

/** Replaces (or removes) the logged-in user's avatar, e.g. from the dashboard. Logged. */
export async function updateMyAvatar(
  image: string | null,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }
  if (image !== null && !isUploadThingUrl(image)) {
    return { success: false, error: 'Ungültiges Bild' }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { image } })
    await logProfileChanges(
      {
        userId: user.id,
        actorId: user.id,
        source: 'profile',
        before: { image: user.image },
        after: { image },
      },
      tx,
    )
  })

  revalidatePath('/', 'layout')
  return { success: true }
}

/** The logged-in user edits their own name, Klasse and avatar. Every change is logged. */
export async function updateMyProfile(
  input: z.input<typeof schema>,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Ungültige Eingabe' }
  const { stufe, letter, image } = parsed.data

  const nameCheck = checkDisplayName(parsed.data.name)
  if (!nameCheck.ok) {
    if (isNameBlocked(parsed.data.name)) {
      await logBlockedName(user.id, parsed.data.name, user.name, 'profile')
    }
    return { success: false, error: nameCheck.error }
  }

  if (image !== null && image !== user.image && !isUploadThingUrl(image)) {
    return { success: false, error: 'Ungültiges Bild' }
  }

  // Teachers, admins and pending teacher requests don't have a Klasse.
  const hasKlasse = !user.isTeacher && !user.isAdmin && !user.teacherRequestedAt
  let klasse: string | undefined
  if (hasKlasse) {
    if (!stufe || !(KLASSENSTUFEN as readonly number[]).includes(stufe)) {
      return { success: false, error: 'Bitte wähle deine Klassenstufe' }
    }
    if (letter && !/^[a-z]$/i.test(letter)) {
      return { success: false, error: 'Der Klassenbuchstabe muss ein Buchstabe sein' }
    }
    if (!letter && stufe < KLASSE_LETTER_OPTIONAL_FROM) {
      return { success: false, error: 'Bitte gib den Buchstaben deiner Klasse an (z. B. b)' }
    }
    klasse = formatKlasse(stufe, letter)
  }

  const after = { name: nameCheck.name, image, ...(klasse !== undefined ? { klasse } : {}) }
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: after })
    await logProfileChanges(
      {
        userId: user.id,
        actorId: user.id,
        source: 'profile',
        before: { name: user.name, klasse: user.klasse, image: user.image },
        after,
      },
      tx,
    )
  })

  revalidatePath('/', 'layout')
  return { success: true }
}
