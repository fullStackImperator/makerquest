import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/get-session-user'
import { getJournalQuestGroups } from '@/lib/journal/queries'
import { JournalEntryForm } from '@/components/journal/journal-entry-form'

export default async function NewJournalEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ quest?: string }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  const { quest } = await searchParams
  const groups = await getJournalQuestGroups(user.id)
  if (groups.length === 0) redirect('/journal')

  const enrolled = groups.some((g) => g.quests.some((q) => q.id === quest))

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Neuer Eintrag</h1>
      <JournalEntryForm
        questGroups={groups}
        initialCourseId={enrolled ? quest : undefined}
        returnHref={enrolled ? `/journal?quest=${quest}` : '/journal'}
      />
    </section>
  )
}
