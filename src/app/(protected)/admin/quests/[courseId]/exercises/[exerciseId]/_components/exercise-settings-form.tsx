'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2 } from 'lucide-react'
import type { Exercise } from '@/generated/client'
import { updateExercise } from '../_actions/update-exercise'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function ExerciseSettingsForm({
  initialData,
  courseId,
  exerciseId,
  suggestedXp,
}: {
  initialData: Exercise
  courseId: string
  exerciseId: string
  /** 15 % of the quest XP; 0 when Klassenstufe or difficulty are missing. */
  suggestedXp: number
}) {
  const router = useRouter()
  const [passingScore, setPassingScore] = useState(
    initialData.passingScore?.toString() ?? '',
  )
  const [xpReward, setXpReward] = useState(initialData.xpReward.toString())
  const [saving, setSaving] = useState(false)

  const onSave = async () => {
    setSaving(true)
    const result = await updateExercise(courseId, exerciseId, {
      passingScore: passingScore ? Number(passingScore) : null,
      xpReward: xpReward ? Number(xpReward) : 0,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Einstellungen gespeichert')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="xp-reward">XP für diese Aufgabe (pro Fach)</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="xp-reward"
            type="number"
            min={0}
            value={xpReward}
            onChange={(e) => setXpReward(e.target.value)}
            className="w-28"
          />
          {suggestedXp > 0 && Number(xpReward) !== suggestedXp && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1"
              onClick={() => setXpReward(suggestedXp.toString())}
            >
              <Wand2 className="size-3.5" />
              Vorschlag: {suggestedXp} XP
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          Wird nach der Bewertung ausgezahlt, anteilig nach den Punkten beim ersten Versuch
          (z. B. 8 von 10 Punkten → 80 %). Vorschlag = 15 % der Quest-XP.
          {suggestedXp === 0 && ' Für einen Vorschlag Klassenstufe und Schwierigkeit der Quest setzen.'}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="passing-score">Mindestpunktzahl für XP (optional)</Label>
        <Input
          id="passing-score"
          type="number"
          min={0}
          placeholder="Keine"
          value={passingScore}
          onChange={(e) => setPassingScore(e.target.value)}
          className="w-28"
        />
      </div>
      <Button onClick={onSave} disabled={saving} size="sm">
        Speichern
      </Button>
    </div>
  )
}
