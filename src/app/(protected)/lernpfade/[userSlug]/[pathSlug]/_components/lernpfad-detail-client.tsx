'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { enrollInLearningPath } from '@/actions/enroll-learning-path'

type StepRow = {
  id: string
  position: number
  courseId: string
  title: string
  status: 'done' | 'current' | 'locked'
}

export function LernpfadDetailClient({
  pathId,
  userSlug,
  enrolled,
  pathCompleted,
  badgeName,
  steps,
}: {
  pathId: string
  userSlug: string
  enrolled: boolean
  pathCompleted: boolean
  badgeName: string | null
  steps: StepRow[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    try {
      const r = await enrollInLearningPath(pathId)
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success('Lernpfad gestartet')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!enrolled && (
        <Button onClick={start} disabled={loading}>
          Lernpfad starten
        </Button>
      )}

      {pathCompleted && (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Du hast diesen Lernpfad abgeschlossen
          {badgeName ? ` — Badge: ${badgeName}` : ''}.
        </p>
      )}

      <ol className="space-y-3">
        {steps.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
          >
            <div>
              <span className="text-muted-foreground mr-2 text-xs">
                {s.position + 1}.
              </span>
              <span className="font-medium">{s.title}</span>
              <span className="text-muted-foreground ml-2 text-xs">
                {s.status === 'done' && 'Abgeschlossen'}
                {s.status === 'current' && 'Aktuell'}
                {s.status === 'locked' && 'Gesperrt'}
              </span>
            </div>
            {s.status === 'current' && enrolled && (
              <Button size="sm" asChild>
                <Link href={`/quests/${s.courseId}`}>Zum Quest</Link>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
