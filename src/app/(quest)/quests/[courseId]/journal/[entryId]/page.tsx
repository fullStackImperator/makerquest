import { redirect } from 'next/navigation'

import { JournalEntryForm } from '@/components/journal/journal-entry-form'
import { getSessionUser } from '@/lib/get-session-user'
import { getJournalQuestOption, getStudentJournalEntry } from '@/lib/journal/queries'
import { isJournalEntryEditable } from '@/lib/journal/shared'

export default async function EditQuestJournalEntryPage({
  params,
}: {
  params: Promise<{ courseId: string; entryId: string }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  const { courseId, entryId } = await params
  const basePath = `/quests/${courseId}/journal`

  const [entry, quest] = await Promise.all([
    getStudentJournalEntry(user.id, entryId),
    getJournalQuestOption(courseId),
  ])
  if (!entry || !quest || entry.courseId !== courseId || !isJournalEntryEditable(entry.status)) {
    redirect(basePath)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Eintrag bearbeiten</h1>
      <JournalEntryForm entry={entry} fixedQuest={quest} returnHref={basePath} />
    </div>
  )
}
