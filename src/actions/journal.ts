'use server'

import { revalidatePath } from 'next/cache'
import { UTApi } from 'uploadthing/server'
import { z } from 'zod'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { isEnrolledInCourse } from '@/lib/journal/queries'
import {
  isJournalEntryEditable,
  isUploadThingUrl,
  JOURNAL_CONTENT_MAX_BYTES,
  lexicalHasContent,
} from '@/lib/journal/shared'

type ActionResult<T = object> =
  | ({ success: true } & T)
  | { success: false; error: string }

const attachmentSchema = z.object({
  url: z.string().refine(isUploadThingUrl, 'Ungültige Datei-URL'),
  fileKey: z.string().max(200).nullish(),
  name: z.string().trim().min(1).max(255),
  mimeType: z.string().max(200).nullish(),
  size: z.number().int().nonnegative().nullish(),
})

const saveSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  chapterId: z.string().nullish(),
  title: z.string().trim().max(200).nullish(),
  /** Serialized Lexical editor state (JSON string). */
  content: z.string().max(JOURNAL_CONTENT_MAX_BYTES, 'Eintrag ist zu groß'),
  attachments: z.array(attachmentSchema).max(20),
  submit: z.boolean().optional(),
})

export type SaveJournalEntryInput = z.input<typeof saveSchema>

function revalidateJournal(courseId: string) {
  revalidatePath('/journal')
  revalidatePath(`/quests/${courseId}/journal`)
  revalidatePath(`/quests/${courseId}`, 'layout')
}

/**
 * Creates or updates a student's own entry (only while DRAFT or REVISE).
 * With `submit`, the entry is marked READY in the same transaction and a
 * version snapshot is stored for the teacher.
 */
export async function saveJournalEntry(
  input: SaveJournalEntryInput,
): Promise<ActionResult<{ entryId: string }>> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = saveSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe',
    }
  }
  const data = parsed.data

  let content: unknown
  try {
    content = JSON.parse(data.content)
  } catch {
    return { success: false, error: 'Ungültiger Inhalt' }
  }

  if (!(await isEnrolledInCourse(user.id, data.courseId))) {
    return { success: false, error: 'Du bist für diesen Quest nicht angemeldet' }
  }

  if (data.chapterId) {
    const chapter = await db.chapter.findFirst({
      where: { id: data.chapterId, courseId: data.courseId },
      select: { id: true },
    })
    if (!chapter) return { success: false, error: 'Kapitel nicht gefunden' }
  }

  if (data.submit && !lexicalHasContent(content) && data.attachments.length === 0) {
    return {
      success: false,
      error: 'Schreib etwas oder hänge eine Datei an, bevor du einreichst',
    }
  }

  try {
    const entryId = await db.$transaction(async (tx) => {
      let id = data.id
      const fields = {
        courseId: data.courseId,
        chapterId: data.chapterId || null,
        title: data.title || null,
        content: content as object,
      }

      if (id) {
        const existing = await tx.journalEntry.findFirst({
          where: { id, userId: user.id },
          select: { status: true, courseId: true },
        })
        if (!existing) throw new JournalError('Eintrag nicht gefunden')
        if (!isJournalEntryEditable(existing.status)) {
          throw new JournalError('Dieser Eintrag kann nicht mehr bearbeitet werden')
        }
        // Once a teacher has seen the entry, it stays with that quest.
        if (existing.status !== 'DRAFT' && existing.courseId !== data.courseId) {
          throw new JournalError('Der Quest eines eingereichten Eintrags kann nicht geändert werden')
        }
        await tx.journalEntry.update({ where: { id }, data: fields })
        await tx.journalAttachment.deleteMany({ where: { entryId: id } })
      } else {
        const created = await tx.journalEntry.create({
          data: { ...fields, userId: user.id },
          select: { id: true },
        })
        id = created.id
      }

      if (data.attachments.length > 0) {
        await tx.journalAttachment.createMany({
          data: data.attachments.map((a, position) => ({
            entryId: id!,
            url: a.url,
            fileKey: a.fileKey ?? null,
            name: a.name,
            mimeType: a.mimeType ?? null,
            size: a.size ?? null,
            position,
          })),
        })
      }

      if (data.submit) {
        const version = (await tx.journalEntryVersion.count({ where: { entryId: id } })) + 1
        await tx.journalEntryVersion.create({
          data: {
            entryId: id,
            version,
            title: fields.title,
            content: fields.content,
            attachments: data.attachments,
          },
        })
        await tx.journalEntry.update({
          where: { id },
          data: { status: 'READY', submittedAt: new Date() },
        })
        await tx.journalEvent.create({
          data: { entryId: id, authorId: user.id, kind: 'SUBMITTED' },
        })
      }

      return id
    })

    revalidateJournal(data.courseId)
    return { success: true, entryId }
  } catch (error) {
    if (error instanceof JournalError) return { success: false, error: error.message }
    console.error('[SAVE_JOURNAL_ENTRY]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}

/** Deletes a draft that was never submitted, including its uploaded files. */
export async function deleteJournalEntry(entryId: string): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const entry = await db.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    select: {
      courseId: true,
      status: true,
      attachments: { select: { fileKey: true } },
      _count: { select: { versions: true } },
    },
  })
  if (!entry) return { success: false, error: 'Eintrag nicht gefunden' }
  if (entry.status !== 'DRAFT' || entry._count.versions > 0) {
    return { success: false, error: 'Nur nicht eingereichte Entwürfe können gelöscht werden' }
  }

  await db.journalEntry.delete({ where: { id: entryId } })

  const keys = entry.attachments.map((a) => a.fileKey).filter((k): k is string => !!k)
  if (keys.length > 0) {
    await new UTApi().deleteFiles(keys).catch((error) => {
      console.error('[DELETE_JOURNAL_FILES]', error)
    })
  }

  revalidateJournal(entry.courseId)
  return { success: true }
}

class JournalError extends Error {}
