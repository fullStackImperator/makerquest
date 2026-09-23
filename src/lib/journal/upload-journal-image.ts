'use client'

import { uploadFiles } from '@/lib/uploadthing'

/** Uploads an image for a journal entry of `courseId` and returns its URL. */
export async function uploadJournalImage(
  courseId: string,
  file: File,
): Promise<string> {
  const [uploaded] = await uploadFiles('journalImage', {
    files: [file],
    input: { courseId },
  })
  const url = uploaded?.serverData?.url ?? uploaded?.ufsUrl
  if (!url) throw new Error('Upload fehlgeschlagen')
  return url
}
