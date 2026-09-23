import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { z } from 'zod'


const f = createUploadthing()

const handleAuth = async () => {
  const user = await getSessionUser()

  const isAuthorized = user?.isTeacher

  if (!user?.id || !isAuthorized) throw new UploadThingError('Unauthorized')
  return { userId: user.id }
} // Fake auth function

const journalInput = z.object({ courseId: z.string().min(1) })

/** Students enrolled in the course, or teachers of the course, may upload journal files. */
const handleJournalAuth = async (courseId: string) => {
  const user = await getSessionUser()
  if (!user?.id) throw new UploadThingError('Unauthorized')

  const enrollment = await db.purchase.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true },
  })
  if (!enrollment && !(await getCourseIfTeachable(courseId, user))) {
    throw new UploadThingError('Unauthorized')
  }

  return { userId: user.id, courseId }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  editorImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  badgeImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  editorFile: f(['text', 'image', 'video', 'audio', 'pdf'])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  chapterVideo: f({ video: { maxFileCount: 1, maxFileSize: '512GB' } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  editorVideo: f({ video: { maxFileCount: 1, maxFileSize: '2GB' } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  // Images placed inside a journal entry's editor content (compressed on the client)
  journalImage: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .input(journalInput)
    .middleware(({ input }) => handleJournalAuth(input.courseId))
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
  // Files attached to a journal entry: videos, PDFs, code, STL, …
  journalAttachment: f({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    video: { maxFileSize: '256MB', maxFileCount: 3 },
    pdf: { maxFileSize: '32MB', maxFileCount: 10 },
    text: { maxFileSize: '4MB', maxFileCount: 10 },
    blob: { maxFileSize: '64MB', maxFileCount: 10 },
  })
    .input(journalInput)
    .middleware(({ input }) => handleJournalAuth(input.courseId))
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
