'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AbmeldenModal } from '@/components/modals/abmelden-modal'
import { unenrollCourse } from '../../app/(quest)/quests/[courseId]/_actions/unenroll-course'

type CourseUnEnrollButtonProps = {
  courseId: string
}

export const CourseUnEnrollButton = ({
  courseId,
}: CourseUnEnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const onClick = async () => {
    try {
      setIsLoading(true)
      const result = await unenrollCourse(courseId)
      if (!result.success) return toast.error(result.error)
      toast.success('Erfolgreich abgemeldet')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AbmeldenModal onConfirm={onClick}>
      <Button disabled={isLoading} size="sm" className="w-full">
        Abmelden
      </Button>
    </AbmeldenModal>
  )
}
