import { AdminQuestsDataTable } from './_components/admin-quests-data-table'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminQuestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect('/')
  }

  const userId = session.user.id

  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  })

  const isAdmin = viewer?.isAdmin === true

  const coursesWithEnrolledStudents = await db.course.findMany({
    where: isAdmin ? {} : { userId },
    include: {
      purchases: {
        select: { userId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const ownerIds = [...new Set(coursesWithEnrolledStudents.map((c) => c.userId))]
  const owners =
    isAdmin && ownerIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true, email: true },
        })
      : []

  const ownerLabelById = new Map(
    owners.map((o) => [o.id, o.name?.trim() || o.email || '—'] as const),
  )

  const tableData = coursesWithEnrolledStudents.map((course) => ({
    id: course.id,
    title: course.title,
    enrolledStudents: course.purchases.length,
    isPublished: course.isPublished,
    ...(isAdmin && {
      ownerLabel: ownerLabelById.get(course.userId) ?? '—',
    }),
  }))

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-center text-3xl my-4">Projekte Übersicht</h1>
      <AdminQuestsDataTable isAdmin={isAdmin} data={tableData} />
    </div>
  )
}
