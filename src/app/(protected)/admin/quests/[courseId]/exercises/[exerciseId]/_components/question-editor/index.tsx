'use client'

import type { ExerciseQuestion } from '@/generated/client'
import { McSingleEditor } from './mc-single-editor'
import { FillBlankEditor } from './fill-blank-editor'
import { ShortTextEditor } from './short-text-editor'
import { MathQuestionEditor } from './math-editor'
import { DragDropEditor } from './drag-drop-editor'
import { H5pEditor } from './h5p-editor'

export function QuestionEditor({
  question,
  courseId,
  exerciseId,
  onSaved,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
  /** Called after a successful save, e.g. to close a surrounding dialog. */
  onSaved?: () => void
}) {
  switch (question.kind) {
    case 'MC_SINGLE':
      return (
        <McSingleEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
          onSaved={onSaved}
        />
      )
    case 'FILL_BLANK':
      return (
        <FillBlankEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
          onSaved={onSaved}
        />
      )
    case 'SHORT_TEXT':
      return (
        <ShortTextEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
          onSaved={onSaved}
        />
      )
    case 'MATH':
      return (
        <MathQuestionEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
          onSaved={onSaved}
        />
      )
    case 'DRAG_DROP':
      return (
        <DragDropEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
          onSaved={onSaved}
        />
      )
    case 'H5P':
      return (
        <H5pEditor
          question={question}
          courseId={courseId}
          exerciseId={exerciseId}
          onSaved={onSaved}
        />
      )
    default:
      return null
  }
}
