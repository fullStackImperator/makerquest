import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { Attachment, Chapter, Course, UserProgress } from '@/generated/client'
import { redirect } from 'next/navigation'
import { CourseSidebarItem } from './course-sidebar-item'
import { CourseProgress } from '@/components/quests/course-progress'
import { CourseUnEnrollButton } from '../../../../../components/quests/course-unenroll-button'
import { AttachmentFormUser } from './attachments-user'
import { CourseProgressButton } from '../chapters/[chapterId]/_components/course-progress-button'
import { CourseEnrollButton } from '@/components/quests/course-enroll-button'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, ListOrdered } from 'lucide-react'

export type CourseChapterPanelProps = {
  chapterId: string
  courseId: string
  chapterTitle: string
  chapterIndex: number
  nextChapterId?: string
  isChapterCompleted: boolean
}

type CourseSidebarProps = {
  course: Course & {
    chapters: (Chapter & {
      userProgress: UserProgress[] | null
    })[]
    attachments: Attachment[]
  }
  progressCount: number
  chapterPanel?: CourseChapterPanelProps | null
}

/** Strip leading "1.", "1.1." etc. so we don't duplicate the index column. */
function chapterTitleForDisplay(raw: string): string {
  let s = raw.trim()
  while (/^\d+\./.test(s)) {
    s = s.replace(/^\d+\.\s*/, '').trim()
  }
  return s || raw
}

export const CourseSidebar = async ({
  course,
  progressCount,
  chapterPanel,
}: CourseSidebarProps) => {
  const user = await getSessionUser()

  if (!user) {
    return redirect('/')
  }

  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: { userId: user.id, courseId: course.id },
    },
  })

  return (
    <div className="border-border/50 bg-card flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border shadow-sm">
      {/* Quest */}
      <div className="from-muted/40 border-border/50 border-b bg-linear-to-b to-transparent p-4">
        <div className="flex gap-3">
          <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60">
            <LayoutDashboard className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
              Quest
            </p>
            <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
              {course.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-muted-foreground text-xs">Schwierigkeit</span>
              <Badge variant="secondary" className="font-normal">
                {course.schwierigkeit}
              </Badge>
            </div>
          </div>
        </div>

        {purchase && (
          <div className="border-border/40 bg-muted/30 mt-4 space-y-2 rounded-lg border p-3">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
              Gesamt-Fortschritt
            </p>
            <CourseProgress variant="default" value={progressCount} />
          </div>
        )}
        {purchase && (
          <div className="mt-3">
            <CourseUnEnrollButton courseId={course.id} />
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {chapterPanel && (
          <div className="border-border/50 border-b">
            <div className="bg-muted/15 border-border/50 border-b px-4 py-2.5">
              <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                <ListOrdered
                  className="size-3.5 shrink-0 opacity-70"
                  aria-hidden
                />
                Kapitel
              </div>
            </div>
            <div className="p-4">
              {purchase ? (
                <CourseProgressButton
                  chapterId={chapterPanel.chapterId}
                  courseId={chapterPanel.courseId}
                  nextChapterId={chapterPanel.nextChapterId}
                  isCompleted={chapterPanel.isChapterCompleted}
                />
              ) : (
                <CourseEnrollButton courseId={course.id} />
              )}
            </div>
          </div>
        )}

        <div className="border-border/50 bg-muted/15 border-b px-4 py-2.5">
          <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
            <ListOrdered className="size-3.5 shrink-0 opacity-70" aria-hidden />
            {chapterPanel ? 'Alle Kapitel' : 'Kapitel'}
          </div>
        </div>

        <div className="flex flex-col">
          {course.chapters.map((chapter, i) => (
            <CourseSidebarItem
              key={chapter.id}
              index={i + 1}
              id={chapter.id}
              label={chapterTitleForDisplay(chapter.title)}
              isCompleted={!!chapter.userProgress?.[0]?.isCompleted}
              courseId={course.id}
              isLocked={!chapter.isFree && !purchase}
            />
          ))}
        </div>

        <div className="border-border/50 mt-auto border-t bg-muted/10 p-4">
          <AttachmentFormUser initialData={course} courseId={course.id} />
        </div>
      </div>
    </div>
  )
}
