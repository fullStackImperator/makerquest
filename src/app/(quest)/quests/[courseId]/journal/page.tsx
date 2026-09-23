import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Banner } from '@/components/banner'
import { JournalFinalGradeCard } from '@/components/journal/journal-final-grade-card'
import { JournalTimeline } from '@/components/journal/journal-timeline'
import { getSessionUser } from '@/lib/get-session-user'
import {
  getStudentFinalGrade,
  getStudentJournalEntries,
  isEnrolledInCourse,
} from '@/lib/journal/queries'

export default async function QuestJournalPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  const { courseId } = await params
  if (!(await isEnrolledInCourse(user.id, courseId))) {
    return (
      <div className="p-4 lg:p-6">
        <Banner label="Melde dich für den Quest an, um dein Journal zu führen." />
      </div>
    )
  }

  const [entries, finalGrade] = await Promise.all([
    getStudentJournalEntries(user.id, courseId),
    getStudentFinalGrade(user.id, courseId),
  ])
  const basePath = `/quests/${courseId}/journal`

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
          <p className="text-muted-foreground text-sm">
            Deine Einträge zu diesem Quest.
          </p>
        </div>
        <Link
          href={`/journal?quest=${courseId}`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          Ganzes Journal ansehen
        </Link>
      </div>
      {finalGrade && <JournalFinalGradeCard grade={finalGrade} />}
      <JournalTimeline entries={entries} basePath={basePath} newHref={`${basePath}/new`} />
    </div>
  )
}
