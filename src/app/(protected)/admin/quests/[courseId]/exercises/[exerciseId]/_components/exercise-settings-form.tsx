'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Exercise } from '@/generated/client'
import { updateExercise } from '../_actions/update-exercise'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export function ExerciseSettingsForm({
  initialData,
  courseId,
  exerciseId,
}: {
  initialData: Exercise
  courseId: string
  exerciseId: string
}) {
  const router = useRouter()
  const [passingScore, setPassingScore] = useState(
    initialData.passingScore?.toString() ?? '',
  )
  const [awardXp, setAwardXp] = useState(initialData.awardXp)
  const [saving, setSaving] = useState(false)

  const onSave = async () => {
    setSaving(true)
    const result = await updateExercise(courseId, exerciseId, {
      passingScore: passingScore ? Number(passingScore) : null,
      awardXp,
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
      <div>
        <Label>Mindestpunktzahl (optional)</Label>
        <Input
          type="number"
          min={0}
          placeholder="Keine"
          value={passingScore}
          onChange={(e) => setPassingScore(e.target.value)}
          className="w-32"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="award-xp"
          checked={awardXp}
          onCheckedChange={(c) => setAwardXp(!!c)}
        />
        <Label htmlFor="award-xp">
          XP vergeben bei bestandener Aufgabe
        </Label>
      </div>
      <Button onClick={onSave} disabled={saving} size="sm">
        Speichern
      </Button>
    </div>
  )
}
