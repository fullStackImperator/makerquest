'use client'

import { createContext, useContext } from 'react'
import type { ExerciseQuestion, QuestionKind } from '@/generated/client'
import type { PublicQuestion, QuestionState } from '@/lib/exercises/public-question'

/**
 * Data behind the "Aufgabe" blocks of a chapter. The block itself only stores
 * a question id; the page decides what the block may show:
 * - teacher: full questions (incl. solutions) to edit, and creating new ones,
 * - student: public questions plus the student's own answer state.
 */
export type ExerciseQuestionContextValue =
  | {
      mode: 'teacher'
      courseId: string
      exerciseId: string | null
      questions: Map<string, ExerciseQuestion>
      /** Creates a question of this kind; returns it or null on error. */
      create: (kind: QuestionKind) => Promise<ExerciseQuestion | null>
      /** Reloads the questions after editing. */
      refresh: () => void
      /** Id of a just-inserted question whose editor should open right away. */
      autoOpenId: string | null
      clearAutoOpen: () => void
    }
  | {
      mode: 'student'
      items: Map<string, { question: PublicQuestion; state: QuestionState }>
      onStateChange?: (questionId: string, state: QuestionState) => void
    }

const ExerciseQuestionContext = createContext<ExerciseQuestionContextValue | null>(null)

export const ExerciseQuestionProvider = ExerciseQuestionContext.Provider

export function useExerciseQuestions() {
  return useContext(ExerciseQuestionContext)
}
