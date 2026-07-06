'use client'

import { Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/modals/confirm-modal'
import { publishExercise } from '../_actions/publish-exercise'
import { unpublishExercise } from '../_actions/unpublish-exercise'
import { deleteExercise } from '../_actions/delete-exercise'

export function ExerciseActions({
  disabled,
  courseId,
  exerciseId,
  isPublished,
}: {
  disabled: boolean
  courseId: string
  exerciseId: string
  isPublished: boolean
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const onClick = async () => {
    try {
      setIsLoading(true)
      const result = isPublished
        ? await unpublishExercise(courseId, exerciseId)
        : await publishExercise(courseId, exerciseId)
      if (!result.success) return toast.error(result.error)
      toast.success(isPublished ? 'Unveröffentlicht' : 'Veröffentlicht')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const onDelete = async () => {
    try {
      setIsLoading(true)
      const result = await deleteExercise(courseId, exerciseId)
      if (!result.success) return toast.error(result.error)
      toast.success('Aufgabe gelöscht')
      router.push(`/admin/quests/${courseId}`)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
      >
        {isPublished ? 'Unveröffentlichen' : 'Veröffentlichen'}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  )
}
