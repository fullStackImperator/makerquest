import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import type { Course } from '@/generated/client'
import { redirect } from 'next/navigation'
import { CourseSidebarItem } from './course-sidebar-item'
import { CourseProgress } from '@/components/quests/course-progress'
import { CourseUnEnrollButton } from '../../../../../components/quests/course-unenroll-button'
import { JournalSidebarCard } from './journal-sidebar-card'
import { MessagesSidebarLink } from './messages-sidebar-link'
import { CourseProgressButton } from '../chapters/[chapterId]/_components/course-progress-button'
import { CourseEnrollButton } from '@/components/quests/course-enroll-button'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, ListOrdered } from 'lucide-react'
import { getCourseProgressionForPage } from '@/lib/exercises/progression'

export type CourseChapterPanelProps = {
  chapterId: string
  courseId: string
  chapterTitle: string
  chapterIndex: number
  /** Next chapter or Aufgabe; undefined on the last item. */
  nextHref?: string
  isChapterCompleted: boolean
  /** Questions in this chapter the student hasn't answered yet. */
  openQuestions: number
}

type CourseSidebarProps = {
  course: Pick<Course, 'id' | 'title' | 'schwierigkeit'>
  progressCount: number
  chapterPanel?: CourseChapterPanelProps | null
}

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

  // Order, done state and locks (behind an Aufgabe that isn't passed yet).
  const { items: progression } = await getCourseProgressionForPage(user.id, course.id)
  const items = progression.map((item) => ({
    ...item,
    isCompleted: item.done,
    statusLabel:
      item.kind === 'exercise' && item.done
        ? item.pendingReview
          ? 'Bestanden · wird geprüft'
          : 'Bestanden'
        : null,
  }))

  return (
    <div className="border-border/50 bg-card flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border shadow-sm">
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
                  nextHref={chapterPanel.nextHref}
                  openQuestions={chapterPanel.openQuestions}
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
            {chapterPanel ? 'Alle Inhalte' : 'Inhalte'}
          </div>
        </div>

        <div className="flex flex-col">
          {items.map((item, i) => (
            <CourseSidebarItem
              key={`${item.kind}-${item.id}`}
              index={i + 1}
              id={item.id}
              kind={item.kind}
              label={chapterTitleForDisplay(item.title)}
              isCompleted={item.isCompleted}
              courseId={course.id}
              isLocked={(!item.isFree && !purchase) || !!item.lockedBy}
              statusLabel={item.statusLabel}
            />
          ))}
        </div>

        {purchase && (
          <div className="border-border/50 mt-auto space-y-2 border-t bg-muted/10 p-4">
            <JournalSidebarCard courseId={course.id} userId={user.id} />
            <MessagesSidebarLink courseId={course.id} userId={user.id} />
          </div>
        )}


      </div>
    </div>
  )
}
