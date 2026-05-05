import { getProgress } from '@/actions/get-progress'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { GradingActions } from './_components/grading-action'

interface GradingPageProps {
  params: Promise<{ courseId: string }>
}

const CourseGradingPage = async ({ params }: GradingPageProps) => {
  const { courseId } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect('/')
  }

  const viewer = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  })

  if (!viewer) {
    redirect('/')
  }

  const teachable = await getCourseIfTeachable(courseId, viewer)

  if (!teachable) {
    redirect('/admin/quests')
  }

  const { course } = teachable

  const enrolledStudents = await db.purchase.findMany({
    where: {
      courseId,
    },
  })

  const studentIds = enrolledStudents.map((e) => e.userId)

  const allAttachments =
    studentIds.length > 0
      ? await db.attachment.findMany({
          where: {
            courseId,
            userId: { in: studentIds },
          },
          orderBy: { createdAt: 'desc' },
        })
      : []

  const attachmentsByUserId = new Map<string, typeof allAttachments>()
  for (const att of allAttachments) {
    if (!att.userId) continue
    const list = attachmentsByUserId.get(att.userId) ?? []
    list.push(att)
    attachmentsByUserId.set(att.userId, list)
  }

  const gradingAndProgressPromises = enrolledStudents.map(
    async (enrollment) => {
      const [grading, userProgress] = await Promise.all([
        db.grading.findFirst({
          where: {
            courseId: enrollment.courseId,
            userId: enrollment.userId,
          },
        }),
        getProgress(enrollment.userId, courseId),
      ])

      const user = await db.user.findUnique({
        where: { id: enrollment.userId },
        select: { name: true },
      })

      const userName = user?.name ?? 'Unbekannt'

      let hasReceivedPoints = false
      for (const fach of course.faecher || []) {
        const alreadyAwardedPoints = await db.awardedPoints.findFirst({
          where: {
            userId: enrollment.userId,
            fachId: fach.id,
            courseId: enrollment.courseId,
          },
        })

        if (alreadyAwardedPoints) {
          hasReceivedPoints = true
          break
        }
      }

      return {
        ...enrollment,
        userName: userName,
        enrolledAt: enrollment.createdAt.toISOString(),
        grading: grading || null,
        progress: userProgress || null,
        hasReceivedPoints: hasReceivedPoints,
        attachments: attachmentsByUserId.get(enrollment.userId) ?? [],
      }
    },
  )

  const enrollmentWithGradingAndProgress = await Promise.all(
    gradingAndProgressPromises,
  )

  return (
    <GradingActions
      courseId={courseId}
      enrollmentWithGradingAndProgress={enrollmentWithGradingAndProgress}
      courseName={course.title}
    />
  )
}

export default CourseGradingPage
