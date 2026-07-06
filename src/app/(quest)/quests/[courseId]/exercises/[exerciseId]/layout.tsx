import { getProgress } from '@/actions/get-progress'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { redirect } from 'next/navigation'
import { CourseSidebar } from '@/app/(quest)/quests/[courseId]/_components/course-sidebar'
import { CourseMobileSidebar } from '@/app/(quest)/quests/[courseId]/_components/course-mobile-sidebar'

export default async function ExerciseCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string; exerciseId: string }>
}) {
  const { courseId, exerciseId } = await params
  const user = await getSessionUser()
  if (!user) redirect('/')

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        where: { isPublished: true },
        include: {
          userProgress: { where: { userId: user.id } },
        },
        orderBy: { position: 'asc' },
      },
      exercises: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        include: {
          attempts: {
            where: { userId: user.id },
            take: 1,
          },
        },
      },
      attachments: true,
    },
  })

  if (!course) redirect('/')

  const progressCount = await getProgress(user.id, course.id)

  const currentExercise = course.exercises.find((e) => e.id === exerciseId)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="bg-muted/30 border-border/60 flex items-center gap-3 border-b px-3 py-2.5 lg:hidden">
        <CourseMobileSidebar
          course={course}
          progressCount={progressCount}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {currentExercise?.title ?? course.title}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <main className="min-w-0 flex-1">{children}</main>
        <aside className="hidden w-full shrink-0 lg:sticky lg:top-0 lg:flex lg:w-80 lg:flex-col lg:self-start">
          <CourseSidebar course={course} progressCount={progressCount} />
        </aside>
      </div>
    </div>
  )
}
