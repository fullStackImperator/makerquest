import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClipboardList, NotebookPen, Users, type LucideIcon } from 'lucide-react'

import { getSessionUser } from '@/lib/get-session-user'
import { getStudentExercises, summarizeExercises } from '@/lib/exercises/teacher-queries'
import {
  getFinalAssessment,
  getOrCreateRubric,
  getTeacherJournalEntries,
  getWorkspaceCourses,
  getWorkspaceStudents,
} from '@/lib/journal/teacher-queries'
import { cn } from '@/lib/utils'
import { FinalGradePanel } from './_components/final-grade-panel'
import { StudentExercises } from './_components/student-exercises'
import { StudentList } from './_components/student-list'
import { TeacherTimeline } from './_components/teacher-timeline'

type Tab = 'journal' | 'aufgaben'

export default async function JournalWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; student?: string; tab?: string }>
}) {
  const viewer = await getSessionUser()
  if (!viewer) redirect('/')

  const params = await searchParams
  const courses = await getWorkspaceCourses(viewer)
  // Only courses from the viewer's own list are accepted, which is the access check.
  const courseId = courses.some((c) => c.id === params.course) ? params.course! : null

  const students = courseId ? await getWorkspaceStudents(courseId) : []
  const student = students.find((s) => s.userId === params.student) ?? null

  // Without an explicit tab, open where the work is: answers to review and no entries waiting.
  const tab: Tab =
    params.tab === 'aufgaben' || params.tab === 'journal'
      ? params.tab
      : student && student.reviewCount > 0 && student.readyCount === 0
        ? 'aufgaben'
        : 'journal'

  const [entries, rubric, assessment, exercises] =
    courseId && student
      ? await Promise.all([
          getTeacherJournalEntries(courseId, student.userId),
          getOrCreateRubric(courseId),
          getFinalAssessment(courseId, student.userId),
          getStudentExercises(courseId, student.userId),
        ])
      : [null, null, null, null]

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:h-[calc(100svh-7.5rem)] lg:grid-cols-[minmax(0,25fr)_minmax(0,45fr)_minmax(0,30fr)]">
      <Pane>
        <StudentList
          courses={courses}
          courseId={courseId}
          students={students}
          selectedUserId={student?.userId ?? null}
          tab={tab}
        />
      </Pane>

      {courseId && student && entries && rubric && assessment && exercises ? (
        <>
          <Pane plain>
            <nav className="flex justify-center px-4 pb-1" aria-label="Ansicht">
              <div className="bg-muted grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl p-1">
                <TabLink
                  href={`/admin/journal?course=${courseId}&student=${student.userId}&tab=journal`}
                  active={tab === 'journal'}
                  icon={NotebookPen}
                  label="Journal"
                  count={student.readyCount}
                  countClassName="bg-sky-500"
                />
                <TabLink
                  href={`/admin/journal?course=${courseId}&student=${student.userId}&tab=aufgaben`}
                  active={tab === 'aufgaben'}
                  icon={ClipboardList}
                  label="Aufgaben"
                  count={student.reviewCount}
                  countClassName="bg-amber-500"
                />
              </div>
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === 'journal' ? (
                <TeacherTimeline key={student.userId} entries={entries} />
              ) : (
                <StudentExercises key={student.userId} courseId={courseId} exercises={exercises} />
              )}
            </div>
          </Pane>
          <Pane>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <FinalGradePanel
                key={student.userId}
                courseId={courseId}
                student={student}
                rubric={rubric}
                assessment={assessment}
                exerciseSummary={summarizeExercises(exercises)}
              />
            </div>
          </Pane>
        </>
      ) : (
        <Pane className="lg:col-span-2">
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-sm">
            <Users className="size-8" aria-hidden />
            {courseId
              ? 'Wähle links einen Schüler aus, um sein Journal zu sehen.'
              : 'Wähle links einen Quest aus.'}
          </div>
        </Pane>
      )}
    </div>
  )
}

function TabLink({
  href,
  active,
  icon: Icon,
  label,
  count,
  countClassName,
}: {
  href: string
  active: boolean
  icon: LucideIcon
  label: string
  count: number
  countClassName: string
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
        active
          ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
      {count > 0 && (
        <span className={cn('rounded-full px-1.5 text-[11px] font-semibold text-white tabular-nums', countClassName)}>
          {count}
        </span>
      )}
    </Link>
  )
}

function Pane({
  children,
  className,
  plain,
}: {
  children: React.ReactNode
  className?: string
  /** No card surface; the content brings its own cards. */
  plain?: boolean
}) {
  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden',
        !plain && 'bg-card border-border/60 rounded-xl border shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  )
}
