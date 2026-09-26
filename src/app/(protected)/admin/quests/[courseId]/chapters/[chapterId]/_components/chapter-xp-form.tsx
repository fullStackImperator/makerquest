'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setChapterQuestionXp } from '../_actions/inline-questions'

export function ChapterXpForm({
  courseId,
  chapterId,
  xpReward,
  suggestedXp,
  questionCount,
  maxPoints,
}: {
  courseId: string
  chapterId: string
  xpReward: number
  /** 15 % of the quest XP; 0 when Klassenstufe or difficulty are missing. */
  suggestedXp: number
  questionCount: number
  maxPoints: number
}) {
  const router = useRouter()
  const [value, setValue] = useState(xpReward.toString())
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      const result = await setChapterQuestionXp(courseId, chapterId, Number(value) || 0)
      if (!result.success) return void toast.error(result.error)
      toast.success('XP gespeichert')
      router.refresh()
    })

  return (
    <div className="space-y-1.5">
      <Label htmlFor="chapter-xp">XP für die Fragen in diesem Kapitel (pro Fach)</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="chapter-xp"
          type="number"
          min={0}
          max={10000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28"
        />
        {suggestedXp > 0 && Number(value) !== suggestedXp && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1"
            onClick={() => setValue(suggestedXp.toString())}
          >
            <Wand2 className="size-3.5" />
            Vorschlag: {suggestedXp} XP
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={pending || Number(value) === xpReward}
          className="gap-1.5"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Speichern
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        {questionCount} {questionCount === 1 ? 'Frage' : 'Fragen'} mit zusammen {maxPoints}{' '}
        {maxPoints === 1 ? 'Punkt' : 'Punkten'}. Wird ausgezahlt, wenn alle Fragen beantwortet und
        bewertet sind, anteilig nach den Punkten beim ersten Versuch. Bereits ausgezahlte XP
        bleiben unverändert.
      </p>
    </div>
  )
}
