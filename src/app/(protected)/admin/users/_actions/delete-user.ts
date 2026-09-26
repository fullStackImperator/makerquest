'use server'

import { revalidatePath } from 'next/cache'
import { UTApi } from 'uploadthing/server'
import { z } from 'zod'

import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { getSessionUser } from '@/lib/get-session-user'
import { isUploadThingUrl } from '@/lib/journal/shared'
import { isOwner } from '@/lib/owner'
import { logSecurityEvent } from '@/lib/security-log'

/** UploadThing URLs end in the file key (…/f/<key> or …/a/<appId>/<key>). */
function fileKeyFromUrl(url: string) {
  if (!isUploadThingUrl(url)) return null
  return new URL(url).pathname.split('/').filter(Boolean).pop() ?? null
}

/** Every UploadThing URL anywhere in a JSON value (Lexical content, attachment snapshots). */
function collectFileKeys(value: unknown, keys: Set<string>) {
  if (typeof value === 'string') {
    const key = fileKeyFromUrl(value)
    if (key) keys.add(key)
  } else if (Array.isArray(value)) {
    for (const v of value) collectFileKeys(v, keys)
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectFileKeys(v, keys)
  }
}

/**
 * Permanently deletes a user and their uploaded files. Admins may delete
 * non-admins; only the owner may delete admins; the owner can't be deleted.
 * Quests, learning paths and course attachments of the user pass to the owner.
 */
export async function deleteUser(
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const viewer = await getSessionUser()
  const viewerIsOwner = isOwner(viewer)
  if (!viewer || (viewer.isAdmin !== true && !viewerIsOwner)) {
    await logSecurityEvent('unauthorized-action', {
      action: 'delete-user',
      userId: viewer?.id ?? null,
      target: userId,
    })
    return { success: false, error: 'Keine Berechtigung' }
  }

  const parsed = z.string().min(1).safeParse(userId)
  if (!parsed.success) return { success: false, error: 'Ungültige Eingabe' }
  if (parsed.data === viewer.id) {
    return { success: false, error: 'Du kannst dich nicht selbst löschen' }
  }

  const target = await db.user.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      email: true,
      image: true,
      isAdmin: true,
      journalEntries: {
        select: {
          content: true,
          attachments: { select: { url: true, fileKey: true } },
          versions: { select: { content: true, attachments: true } },
        },
      },
    },
  })
  if (!target) return { success: false, error: 'Nutzer nicht gefunden' }
  if (isOwner(target)) {
    return { success: false, error: 'Der Owner kann nicht gelöscht werden' }
  }
  if (target.isAdmin === true && !viewerIsOwner) {
    await logSecurityEvent('unauthorized-action', {
      action: 'delete-user',
      userId: viewer.id,
      target: target.id,
      reason: 'target-is-admin',
    })
    return { success: false, error: 'Nur der Owner kann Admins löschen' }
  }

  // Content that other people rely on is handed over instead of deleted.
  const owner = env.OWNER_EMAIL
    ? await db.user.findUnique({ where: { email: env.OWNER_EMAIL }, select: { id: true } })
    : null
  const [ownedCourses, ownedPaths, courseAttachments] = await Promise.all([
    db.course.count({ where: { userId: target.id } }),
    db.learningPath.count({ where: { ownerId: target.id } }),
    db.attachment.count({ where: { userId: target.id } }),
  ])
  if (!owner && ownedCourses + ownedPaths + courseAttachments > 0) {
    return {
      success: false,
      error: 'Owner-Konto nicht gefunden (OWNER_EMAIL) – Quests und Lernpfade können nicht übertragen werden.',
    }
  }

  const fileKeys = new Set<string>()
  const avatarKey = target.image ? fileKeyFromUrl(target.image) : null
  if (avatarKey) fileKeys.add(avatarKey)
  for (const entry of target.journalEntries) {
    collectFileKeys(entry.content, fileKeys)
    for (const a of entry.attachments) {
      const key = a.fileKey ?? fileKeyFromUrl(a.url)
      if (key) fileKeys.add(key)
    }
    for (const v of entry.versions) {
      collectFileKeys(v.content, fileKeys)
      collectFileKeys(v.attachments, fileKeys)
    }
  }

  try {
    await db.$transaction([
      ...(owner
        ? [
            db.course.updateMany({ where: { userId: target.id }, data: { userId: owner.id } }),
            db.learningPath.updateMany({ where: { ownerId: target.id }, data: { ownerId: owner.id } }),
            db.attachment.updateMany({ where: { userId: target.id }, data: { userId: owner.id } }),
          ]
        : []),
      // These tables store a plain userId without a relation, so nothing cascades.
      db.userProgress.deleteMany({ where: { userId: target.id } }),
      db.purchase.deleteMany({ where: { userId: target.id } }),
      db.grading.deleteMany({ where: { userId: target.id } }),
      db.userBadge.deleteMany({ where: { userId: target.id } }),
      db.user.delete({ where: { id: target.id } }),
    ])
  } catch (error) {
    console.error('[DELETE_USER]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }

  // After the commit: a failed file cleanup must not resurrect the user.
  if (fileKeys.size > 0) {
    await new UTApi().deleteFiles([...fileKeys]).catch((error) => {
      console.error('[DELETE_USER_FILES]', error)
    })
  }

  await logSecurityEvent('user-deleted', {
    userId: viewer.id,
    target: target.id,
    email: target.email,
    transferredTo: owner?.id ?? null,
    transferred: { courses: ownedCourses, learningPaths: ownedPaths, attachments: courseAttachments },
    deletedFiles: fileKeys.size,
  })
  revalidatePath('/admin/users')
  return { success: true }
}
