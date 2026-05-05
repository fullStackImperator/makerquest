import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CreateLearningPathForm } from '../_components/create-learning-path-form'
import { getSessionUser } from '@/lib/get-session-user'
import { db } from '@/lib/db'

export default async function NewLearningPathPage() {
  const user = await getSessionUser()
  if (!user) redirect('/')
  if (!user.isTeacher && !user.isAdmin) redirect('/')

  const badges = await db.badge.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <Link
        href="/admin/lernpfade"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Zurück
      </Link>
      <h1 className="text-2xl font-semibold">Neuer Lernpfad</h1>
      <CreateLearningPathForm badges={badges} />
    </div>
  )
}
