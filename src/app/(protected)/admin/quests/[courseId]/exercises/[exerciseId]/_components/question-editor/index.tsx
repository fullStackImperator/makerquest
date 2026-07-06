'use client'

import type { ExerciseQuestion } from '@/generated/client'
import { McSingleEditor } from './mc-single-editor'
import { FillBlankEditor } from './fill-blank-editor'
import { ShortTextEditor } from './short-text-editor'
import { MathQuestionEditor } from './math-editor'
import { DragDropEditor } from './drag-drop-editor'

export function QuestionEditor({
  question,
  courseId,
  exerciseId,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
}) {
  switch (question.kind) {
    case 'MC_SINGLE':
      return (
        <McSingleEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
        />
      )
    case 'FILL_BLANK':
      return (
        <FillBlankEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
        />
      )
    case 'SHORT_TEXT':
      return (
        <ShortTextEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
        />
      )
    case 'MATH':
      return (
        <MathQuestionEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
        />
      )
    case 'DRAG_DROP':
      return (
        <DragDropEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
        />
      )
    default:
      return null
  }
}
