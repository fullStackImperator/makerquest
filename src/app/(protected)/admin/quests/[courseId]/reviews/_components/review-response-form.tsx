'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveResponse, overrideResponse } from '../_actions/review-response'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function ReviewResponseForm({
  courseId,
  responseId,
  autoScore,
  maxPoints,
  studentAnswer,
  aiFeedback,
}: {
  courseId: string
  responseId: string
  autoScore: number | null
  maxPoints: number
  studentAnswer: string
  aiFeedback: string | null
}) {
  const router = useRouter()
  const [score, setScore] = useState(String(autoScore ?? 0))
  const [feedback, setFeedback] = useState(aiFeedback ?? '')
  const [loading, setLoading] = useState(false)

  const onApprove = async () => {
    setLoading(true)
    const result = await approveResponse(courseId, responseId)
    setLoading(false)
    if (result.success) {
      toast.success('Freigegeben')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const onOverride = async () => {
    setLoading(true)
    const result = await overrideResponse(
      courseId,
      responseId,
      Number(score) || 0,
      feedback,
    )
    setLoading(false)
    if (result.success) {
      toast.success('Überschrieben')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Schülerantwort</Label>
        <p className="mt-1 rounded-md border bg-muted/20 p-3 text-sm">
          {studentAnswer || '(leer)'}
        </p>
      </div>
      {aiFeedback && (
        <div>
          <Label className="text-xs text-muted-foreground">KI-Feedback</Label>
          <p className="mt-1 text-sm">{aiFeedback}</p>
        </div>
      )}
      <div className="flex gap-4">
        <div>
          <Label>Punkte (max {maxPoints})</Label>
          <Input
            type="number"
            min={0}
            max={maxPoints}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-24"
          />
        </div>
      </div>
      <div>
        <Label>Feedback</Label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onApprove} disabled={loading} variant="outline">
          KI-Bewertung übernehmen
        </Button>
        <Button onClick={onOverride} disabled={loading}>
          Speichern
        </Button>
      </div>
    </div>
  )
}
