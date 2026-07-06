import { Menu } from 'lucide-react'
import {
  Attachment,
  Chapter,
  Course,
  Exercise,
  ExerciseAttempt,
  UserProgress,
} from '@/generated/client'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  CourseSidebar,
  type CourseChapterPanelProps,
} from './course-sidebar'

type CourseMobileSidebarProps = {
  course: Course & {
    chapters: (Chapter & {
      userProgress: UserProgress[] | null
    })[]
    exercises?: (Exercise & { attempts: ExerciseAttempt[] })[]
    attachments: Attachment[]
  }
  progressCount: number
  chapterPanel?: CourseChapterPanelProps | null
}

export const CourseMobileSidebar = ({
  course,
  progressCount,
  chapterPanel,
}: CourseMobileSidebarProps) => {
  return (
    <Sheet>
      <SheetTrigger className="hover:opacity-75 pr-4 transition lg:hidden">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(22rem,100vw)] border-border/60 bg-background p-0"
      >
        <CourseSidebar
          course={course}
          progressCount={progressCount}
          chapterPanel={chapterPanel ?? null}
        />
      </SheetContent>
    </Sheet>
  )
}
