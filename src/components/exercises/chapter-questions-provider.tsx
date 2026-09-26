'use client'

import { useMemo } from 'react'

import { ExerciseQuestionProvider } from '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/context/ExerciseQuestionContext'
import type { PublicQuestion, QuestionState } from '@/lib/exercises/public-question'

/** Makes a chapter's questions available to its "Aufgabe" blocks (student view). */
export function ChapterQuestionsProvider({
  items,
  children,
}: {
  items: { question: PublicQuestion; state: QuestionState }[]
  children: React.ReactNode
}) {
  const value = useMemo(
    () => ({
      mode: 'student' as const,
      items: new Map(items.map((item) => [item.question.id, item])),
    }),
    [items],
  )
  return <ExerciseQuestionProvider value={value}>{children}</ExerciseQuestionProvider>
}
