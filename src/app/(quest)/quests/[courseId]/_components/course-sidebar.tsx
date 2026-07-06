import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import {
  Attachment,
  Chapter,
  Course,
  Exercise,
  ExerciseAttempt,
  UserProgress,
} from '@/generated/client'
import { redirect } from 'next/navigation'
import { CourseSidebarItem } from './course-sidebar-item'
import { CourseProgress } from '@/components/quests/course-progress'
import { CourseUnEnrollButton } from '../../../../../components/quests/course-unenroll-button'
import { AttachmentFormUser } from './attachments-user'
import { CourseProgressButton } from '../chapters/[chapterId]/_components/course-progress-button'
import { CourseEnrollButton } from '@/components/quests/course-enroll-button'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, ListOrdered } from 'lucide-react'
import { mergeCourseItems } from '@/lib/exercises/merge-course-items'
import { attemptStatusLabel } from '@/lib/exercises/sidebar-items'

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
    exercises?: (Exercise & {
      attempts: ExerciseAttempt[]
    })[]
    attachments: Attachment[]
  }
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

  const items = mergeCourseItems(
    course.chapters,
    course.exercises ?? [],
  ).map((item) => {
    if (item.kind === 'chapter') {
      const ch = course.chapters.find((c) => c.id === item.id)
      return {
        ...item,
        isCompleted: !!ch?.userProgress?.[0]?.isCompleted,
        statusLabel: null as string | null,
      }
    }
    const ex = course.exercises?.find((e) => e.id === item.id)
    const attempt = ex?.attempts?.[0]
    const status = attempt?.status
    return {
      ...item,
      isCompleted: status === 'GRADED',
      statusLabel: attemptStatusLabel(status),
    }
  })

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
              isLocked={!item.isFree && !purchase}
              statusLabel={item.statusLabel}
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
