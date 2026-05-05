import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getSessionUser } from '@/lib/get-session-user'
import { db } from '@/lib/db'
import { Plus } from 'lucide-react'

export default async function AdminLernpfadePage() {
  const user = await getSessionUser()
  if (!user) redirect('/')
  if (!user.isTeacher && !user.isAdmin) redirect('/')

  const paths = await db.learningPath.findMany({
    where:
      user.isAdmin === true
        ? {}
        : { ownerId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { steps: true, enrollments: true } },
    },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lernpfade</h1>
        <Button asChild>
          <Link href="/admin/lernpfade/new">
            <Plus className="mr-2 size-4" />
            Neuer Lernpfad
          </Link>
        </Button>
      </div>
      <ul className="divide-y rounded-lg border">
        {paths.length === 0 ? (
          <li className="text-muted-foreground p-6 text-sm">Noch keine Lernpfade.</li>
        ) : (
          paths.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 p-4"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-muted-foreground text-xs">
                  {p.difficulty} · {p._count.steps} Schritte ·{' '}
                  {p.isPublished ? 'Veröffentlicht' : 'Entwurf'}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/lernpfade/${p.id}/edit`}>Bearbeiten</Link>
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
