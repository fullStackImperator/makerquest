import Link from 'next/link'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** Shown instead of a chapter/Aufgabe that sits behind an Aufgabe not passed yet. */
export function LockedByExercise({
  courseId,
  exercise,
}: {
  courseId: string
  exercise: { id: string; title: string }
}) {
  return (
    <div className="bg-card mx-auto flex max-w-xl flex-col items-center gap-3 rounded-xl border p-8 text-center shadow-sm">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Lock className="text-muted-foreground size-5" aria-hidden />
      </div>
      <p className="font-semibold">Noch gesperrt</p>
      <p className="text-muted-foreground text-sm">
        Bestehe zuerst die Aufgabe „{exercise.title}“. Danach geht es hier weiter.
      </p>
      <Button asChild>
        <Link href={`/quests/${courseId}/exercises/${exercise.id}`}>Zur Aufgabe</Link>
      </Button>
    </div>
  )
}
