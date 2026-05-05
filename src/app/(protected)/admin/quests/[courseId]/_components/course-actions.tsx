'use client'

import { Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useConfettiStore } from '@/hooks/use-confetti-store'
import { publishCourse } from '../_actions/publish-course'
import { unpublishCourse } from '../_actions/unpublish-course'
import { deleteCourse } from '../_actions/delete-course'

interface CourseActionsProps {
  disabled: boolean
  courseId: string
  isPublished: boolean
}

export const CourseActions = ({
  disabled,
  courseId,
  isPublished,
}: CourseActionsProps) => {
  const confetti = useConfettiStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const onClick = async () => {
    try {
      setIsLoading(true)

      if (isPublished) {
        const result = await unpublishCourse(courseId)
        if (!result.success) return toast.error(result.error)
        toast.success('Projekt unveröffentlicht')
      } else {
        const result = await publishCourse(courseId)
        if (!result.success) return toast.error(result.error)
        toast.success('Projekt veröffentlicht')
        confetti.onOpen()
      }

      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const onDelete = async () => {
    try {
      setIsLoading(true)
      const result = await deleteCourse(courseId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Projekt gelöscht')
      setDeleteOpen(false)
      router.push('/admin/quests')
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
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={isLoading} variant="destructive">
            <Trash className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieses Projekt wird unwiderruflich gelöscht. Alle Kapitel und
              zugehörigen Daten gehen verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? 'Wird gelöscht…' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
