import { getProgress } from '@/actions/get-progress'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { redirect } from 'next/navigation'
import {
  CourseSidebar,
  type CourseChapterPanelProps,
} from '@/app/(quest)/quests/[courseId]/_components/course-sidebar'
import { CourseMobileSidebar } from '@/app/(quest)/quests/[courseId]/_components/course-mobile-sidebar'

const ChapterCourseLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string; chapterId: string }>
}) => {
  const { courseId, chapterId } = await params
  const user = await getSessionUser()

  if (!user) {
    return redirect('/')
  }

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
      attachments: true,
    },
  })

  if (!course) {
    return redirect('/')
  }

  const progressCount = await getProgress(user.id, course.id)

  const chapterIdx = course.chapters.findIndex((c) => c.id === chapterId)
  const currentChapter =
    chapterIdx >= 0 ? course.chapters[chapterIdx] : undefined
  const nextChapter =
    chapterIdx >= 0 && chapterIdx < course.chapters.length - 1
      ? course.chapters[chapterIdx + 1]
      : undefined

  const chapterPanel: CourseChapterPanelProps | null = currentChapter
    ? {
        chapterId: currentChapter.id,
        courseId: course.id,
        chapterTitle: currentChapter.title,
        chapterIndex: chapterIdx + 1,
        nextChapterId: nextChapter?.id,
        isChapterCompleted:
          !!currentChapter.userProgress?.[0]?.isCompleted,
      }
    : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="bg-muted/30 border-border/60 flex items-center gap-3 border-b px-3 py-2.5 lg:hidden">
        <CourseMobileSidebar
          course={course}
          progressCount={progressCount}
          chapterPanel={chapterPanel}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {currentChapter?.title ?? course.title}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <main className="min-w-0 flex-1">{children}</main>
        <aside className="hidden w-full shrink-0 lg:sticky lg:top-0 lg:flex lg:w-80 lg:flex-col lg:self-start">
          <CourseSidebar
            course={course}
            progressCount={progressCount}
            chapterPanel={chapterPanel}
          />
        </aside>
      </div>
    </div>
  )
}

export default ChapterCourseLayout
