import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/get-session-user'
import { getJournalQuestGroups, getStudentJournalEntry } from '@/lib/journal/queries'
import { isJournalEntryEditable } from '@/lib/journal/shared'
import { JournalEntryForm } from '@/components/journal/journal-entry-form'

export default async function EditJournalEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  const { entryId } = await params
  const [entry, groups] = await Promise.all([
    getStudentJournalEntry(user.id, entryId),
    getJournalQuestGroups(user.id),
  ])
  if (!entry || !isJournalEntryEditable(entry.status)) redirect('/journal')

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Eintrag bearbeiten</h1>
      <JournalEntryForm
        entry={entry}
        questGroups={groups}
        returnHref={`/journal?quest=${entry.courseId}`}
      />
    </section>
  )
}
