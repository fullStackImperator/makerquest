import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'

import { getSessionUser } from '@/lib/get-session-user'
import {
  getFinalAssessment,
  getOrCreateRubric,
  getTeacherJournalEntries,
  getWorkspaceCourses,
  getWorkspaceStudents,
} from '@/lib/journal/teacher-queries'
import { FinalGradePanel } from './_components/final-grade-panel'
import { StudentList } from './_components/student-list'
import { TeacherTimeline } from './_components/teacher-timeline'

export default async function JournalWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; student?: string }>
}) {
  const viewer = await getSessionUser()
  if (!viewer) redirect('/')

  const params = await searchParams
  const courses = await getWorkspaceCourses(viewer)
  // Only courses from the viewer's own list are accepted, which is the access check.
  const courseId = courses.some((c) => c.id === params.course) ? params.course! : null

  const students = courseId ? await getWorkspaceStudents(courseId) : []
  const student = students.find((s) => s.userId === params.student) ?? null

  const [entries, rubric, assessment] =
    courseId && student
      ? await Promise.all([
          getTeacherJournalEntries(courseId, student.userId),
          getOrCreateRubric(courseId),
          getFinalAssessment(courseId, student.userId),
        ])
      : [null, null, null]

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:h-[calc(100svh-7.5rem)] lg:grid-cols-[minmax(0,25fr)_minmax(0,45fr)_minmax(0,30fr)]">
      <Pane>
        <StudentList
          courses={courses}
          courseId={courseId}
          students={students}
          selectedUserId={student?.userId ?? null}
        />
      </Pane>

      {courseId && student && entries && rubric && assessment ? (
        <>
          <Pane>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TeacherTimeline key={student.userId} entries={entries} />
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

function Pane({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`bg-card border-border/60 flex min-h-0 flex-col overflow-hidden rounded-xl border shadow-sm ${className ?? ''}`}
    >
      {children}
    </section>
  )
}
