'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { db } from '@/lib/db'
import { checkDisplayName, isNameBlocked } from '@/lib/name-policy'
import { logBlockedName, logProfileChanges } from '@/lib/profile-log'
import { getSessionUser } from '@/lib/get-session-user'
import {
  formatKlasse,
  KLASSE_LETTER_OPTIONAL_FROM,
  KLASSENSTUFEN,
} from '@/lib/profile'

const schema = z.object({
  name: z.string().max(200),
  requestTeacher: z.boolean(),
  stufe: z.number().int().nullable(),
  letter: z.string().trim().max(1),
})

/** Saves the profile and redirects to the dashboard; returns only on validation errors. */
export async function completeProfile(
  input: z.input<typeof schema>,
): Promise<{ success: false; error: string }> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }
  }
  const { requestTeacher, stufe, letter } = parsed.data
  const nameCheck = checkDisplayName(parsed.data.name)
  if (!nameCheck.ok) {
    if (isNameBlocked(parsed.data.name)) {
      await logBlockedName(user.id, parsed.data.name, user.name, 'onboarding')
    }
    return { success: false, error: nameCheck.error }
  }
  const name = nameCheck.name

  const isStaff = user.isTeacher === true || user.isAdmin === true
  const data: { name: string; klasse?: string | null; teacherRequestedAt?: Date | null } = { name }

  if (!isStaff) {
    if (requestTeacher) {
      data.teacherRequestedAt = user.teacherRequestedAt ?? new Date()
      data.klasse = null
    } else {
      if (!stufe || !(KLASSENSTUFEN as readonly number[]).includes(stufe)) {
        return { success: false, error: 'Bitte wähle deine Klassenstufe' }
      }
      if (letter && !/^[a-z]$/i.test(letter)) {
        return { success: false, error: 'Der Klassenbuchstabe muss ein Buchstabe sein' }
      }
      if (!letter && stufe < KLASSE_LETTER_OPTIONAL_FROM) {
        return { success: false, error: 'Bitte gib den Buchstaben deiner Klasse an (z. B. b)' }
      }
      data.klasse = formatKlasse(stufe, letter)
      data.teacherRequestedAt = null
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data })
    await logProfileChanges(
      {
        userId: user.id,
        actorId: user.id,
        source: 'onboarding',
        before: { name: user.name, klasse: user.klasse },
        after: { name: data.name, ...(data.klasse !== undefined ? { klasse: data.klasse } : {}) },
      },
      tx,
    )
  })
  redirect(user.slug ? `/dashboard/${user.slug}` : '/')
}
