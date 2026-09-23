import { redirect } from 'next/navigation'

import { JournalEntryForm } from '@/components/journal/journal-entry-form'
import { getSessionUser } from '@/lib/get-session-user'
import { getJournalQuestOption, isEnrolledInCourse } from '@/lib/journal/queries'

export default async function NewQuestJournalEntryPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  const { courseId } = await params
  const basePath = `/quests/${courseId}/journal`
  if (!(await isEnrolledInCourse(user.id, courseId))) redirect(basePath)

  const quest = await getJournalQuestOption(courseId)
  if (!quest) redirect('/quests')

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Neuer Eintrag</h1>
      <JournalEntryForm fixedQuest={quest} returnHref={basePath} />
    </div>
  )
}
