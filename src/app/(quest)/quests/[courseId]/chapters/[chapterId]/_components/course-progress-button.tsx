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
  nextChapterId?: string
  isCompleted?: boolean
}

export const CourseProgressButton = ({
  chapterId,
  courseId,
  nextChapterId,
  isCompleted,
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

      if (!isCompleted && !nextChapterId) {
        confetti.onOpen()
        toast.success('Projekt abgeschlossen. Der Lehrmeister wird informiert.')
      } else if (!isCompleted && nextChapterId) {
        toast.success('Fortschritt aktualisiert')
        router.push(`/quests/${courseId}/chapters/${nextChapterId}`)
      }

      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = isCompleted ? XCircle : CheckCircle

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
