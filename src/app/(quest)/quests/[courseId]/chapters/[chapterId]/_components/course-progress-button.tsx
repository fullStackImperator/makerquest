'use client'

import { Button } from '@/components/ui/button'
import { useConfettiStore } from '@/hooks/use-confetti-store'
import { CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { updateChapterProgress } from '../_actions/update-progress'

type CourseProgressButtonProps = {
  chapterId: string
  courseId: string
  /** Next chapter or Aufgabe; undefined on the last item. */
  nextHref?: string
  isCompleted?: boolean
  /** Unanswered questions block "Als fertig markieren". */
  openQuestions?: number
}

export const CourseProgressButton = ({
  chapterId,
  courseId,
  nextHref,
  isCompleted,
  openQuestions = 0,
}: CourseProgressButtonProps) => {
  const router = useRouter()
  const confetti = useConfettiStore()
  const [isLoading, setIsLoading] = useState(false)

  const onClick = async () => {
    try {
      setIsLoading(true)

      const result = await updateChapterProgress(
        courseId,
        chapterId,
        !isCompleted,
      )
      if (!result.success) return toast.error(result.error)

      if (!isCompleted && nextHref) {
        // One navigation only; the action already invalidated the quest pages.
        router.push(nextHref)
        return
      }
      if (!isCompleted) {
        confetti.onOpen()
        toast.success('Projekt abgeschlossen. Der Lehrmeister wird informiert.')
      }
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = isCompleted ? XCircle : CheckCircle
  const blocked = !isCompleted && openQuestions > 0

  if (blocked) {
    return (
      <div className="space-y-1.5">
        <Button disabled variant="secondary" className="w-full">
          Als fertig markieren
          <CheckCircle className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Beantworte zuerst {openQuestions === 1 ? 'die Aufgabe' : `alle ${openQuestions} Aufgaben`} in
          diesem Kapitel.
        </p>
      </div>
    )
  }

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant={isCompleted ? 'outline' : 'secondary'}
      className="w-full"
    >
      {isCompleted ? 'Nicht fertig' : 'Als fertig markieren'}
      <Icon className="ml-2 h-4 w-4" />
    </Button>
  )
}
