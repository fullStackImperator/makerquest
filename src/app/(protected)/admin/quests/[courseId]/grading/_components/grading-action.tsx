'use client'

import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { updateGrade } from '../_actions/update-grade'

import {
  GradingDataTable,
  type GradingStudentRow,
} from './grading-table'

interface GradingActionsProps {
  courseId: string
  enrollmentWithGradingAndProgress: GradingStudentRow[]
  courseName?: string | ''
}

export const GradingActions = ({
  courseId,
  enrollmentWithGradingAndProgress,
  courseName,
}: GradingActionsProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [updatedPoints, setUpdatedPoints] = useState<
    Record<string, number>
  >({})
  const [pointsAwarded, setPointsAwarded] = useState<
    Record<string, boolean>
  >(
    enrollmentWithGradingAndProgress.reduce(
      (acc, student) => ({
        ...acc,
        [student.userId]: student.hasReceivedPoints,
      }),
      {},
    ),
  )

  const onClick = async () => {
    try {
      setIsLoading(true)

      const updateData = Object.entries(updatedPoints).map(
        ([userId, points]) => ({
          userId,
          points,
        }),
      )

      const result = await updateGrade(courseId, updateData)
      if (!result.success) return toast.error(result.error)

      toast.success('Punkte wurden vergeben')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between align-middle">
        <Link
          href="/admin/quests"
          className="flex items-center text-sm transition hover:opacity-75"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Kursübersicht
        </Link>
        <Button
          onClick={onClick}
          disabled={isLoading || Object.keys(updatedPoints).length === 0}
          variant="secondary"
          size="sm"
        >
          Punkte speichern
        </Button>
      </div>
      <h1 className="mt-6 p-6 text-xl font-bold">Projekt: {courseName}</h1>
      <h4 className="text-muted-foreground mb-4 pl-6">
        Punkte für angemeldete Schüler vergeben
      </h4>
      <div className="space-y-4">
        <GradingDataTable
          data={enrollmentWithGradingAndProgress}
          contextValue={{
            courseId,
            updatedPoints,
            setUpdatedPoints,
            pointsAwarded,
            setPointsAwarded,
          }}
        />
      </div>
    </div>
  )
}
