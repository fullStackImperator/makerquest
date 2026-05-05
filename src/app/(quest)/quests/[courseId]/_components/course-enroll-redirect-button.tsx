'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { enrollCourse } from '../_actions/enroll-course'

type CourseEnrollRedirectButtonProps = {
  courseId: string
  firstChapterId: string
}

export const CourseEnrollRedirectButton = ({
  courseId,
  firstChapterId,
}: CourseEnrollRedirectButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const onClick = async () => {
    try {
      setIsLoading(true)

      const result = await enrollCourse(courseId)
      if (!result.success) return toast.error(result.error)

      toast.success('Erfolgreich angemeldet')
      router.push(`/quests/${courseId}/chapters/${firstChapterId}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      size="sm"
      variant="secondary"
      className="w-full"
    >
      Anmelden
    </Button>
  )
}
