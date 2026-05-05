'use client'

import { Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/modals/confirm-modal'
import { publishChapter } from '../_actions/publish-chapter'
import { unpublishChapter } from '../_actions/unpublish-chapter'
import { deleteChapter } from '../_actions/delete-chapter'

interface ChapterActionsProps {
  disabled: boolean
  courseId: string
  chapterId: string
  isPublished: boolean
}

export const ChapterActions = ({
  disabled,
  courseId,
  chapterId,
  isPublished,
}: ChapterActionsProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const onClick = async () => {
    try {
      setIsLoading(true)
      const result = isPublished
        ? await unpublishChapter(courseId, chapterId)
        : await publishChapter(courseId, chapterId)

      if (!result.success) return toast.error(result.error)

      toast.success(
        isPublished ? 'Kapitel unveröffentlicht' : 'Kapitel veröffentlicht',
      )
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const onDelete = async () => {
    try {
      setIsLoading(true)
      const result = await deleteChapter(courseId, chapterId)
      if (!result.success) return toast.error(result.error)
      toast.success('Kapitel gelöscht')
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
