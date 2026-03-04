"use client"

import { enrollInCourse } from "@/actions/enroll-course"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type CourseEnrollButtonProps = {
  level: number
  courseId: string
}

export const CourseEnrollButton = ({
  level: _level,
  courseId,
}: CourseEnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const onClick = async () => {
    try {
      setIsLoading(true)
      const result = await enrollInCourse(courseId)

      if (result.success) {
        toast.success("Erfolgreich angemeldet")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Etwas ist schiefgelaufen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      size="sm"
      className="w-full md:w-auto"
    >
      Anmelden
    </Button>
  )
}