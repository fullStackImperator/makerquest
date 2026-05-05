import { BadgeActions } from './_components/badges-action'
import { auth } from '@/lib/auth'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

interface BadgesPageProps {
  params: Promise<{ courseId: string }>
}

const CourseBadgePage = async ({ params }: BadgesPageProps) => {
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

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  })

  if (!course) {
    redirect('/admin/quests')
  }

  const enrolledStudents = await db.purchase.findMany({
    where: { courseId },
  })

  const badgePromises = enrolledStudents.map(async (enrollment) => {
    const [userBadges, user] = await Promise.all([
      db.userBadge.findMany({
        where: { userId: enrollment.userId },
      }),
      db.user.findUnique({
        where: { id: enrollment.userId },
        select: { name: true },
      }),
    ])

    return {
      ...enrollment,
      userName: user?.name ?? 'Unbekannt',
      userBadges: userBadges.length > 0 ? userBadges : null,
    }
  })

  const enrollmentWithBadges = await Promise.all(badgePromises)
  const badges = await db.badge.findMany()

  return (
    <BadgeActions
      courseId={courseId}
      badges={badges}
      enrollmentWithBadges={enrollmentWithBadges}
      courseName={course.title}
      options={badges.map((badge) => ({
        label: badge.name,
        value: badge.id,
      }))}
    />
  )
}

export default CourseBadgePage
