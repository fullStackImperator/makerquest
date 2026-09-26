'use client'

import { useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { COMMAND_PRIORITY_EDITOR, createCommand, type LexicalCommand } from 'lexical'
import { Loader2 } from 'lucide-react'

import type { QuestionKind } from '@/generated/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QUESTION_KIND_LABELS } from '@/lib/exercises/types'
import { useExerciseQuestions } from '../../context/ExerciseQuestionContext'
import { $createExerciseQuestionNode, ExerciseQuestionNode } from '../../nodes/ExerciseQuestionNode'

/** Opens the question type picker (toolbar "+", slash menu). */
export const OPEN_EXERCISE_QUESTION_PICKER: LexicalCommand<void> = createCommand(
  'OPEN_EXERCISE_QUESTION_PICKER',
)

const KIND_HINTS: Record<QuestionKind, string> = {
  MC_SINGLE: 'Eine richtige Antwort aus mehreren',
  FILL_BLANK: 'Lücken mit festen Antworten',
  SHORT_TEXT: 'Freie Antwort, Lehrkraft bewertet (KI-Vorschlag)',
  MATH: 'Mathematischer Ausdruck oder Zahl',
  DRAG_DROP: 'Reihenfolge oder Zuordnung',
  H5P: 'Eingebetteter H5P-Inhalt',
}

/** Inserts "Aufgabe" blocks; only active in the teacher's chapter editor. */
export default function ExerciseQuestionPlugin() {
  const [editor] = useLexicalComposerContext()
  const ctx = useExerciseQuestions()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState<QuestionKind | null>(null)

  useEffect(() => {
    if (!editor.hasNodes([ExerciseQuestionNode])) return
    return editor.registerCommand(
      OPEN_EXERCISE_QUESTION_PICKER,
      () => {
        setOpen(true)
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  if (ctx?.mode !== 'teacher') return null

  const pick = async (kind: QuestionKind) => {
    setCreating(kind)
    const question = await ctx.create(kind)
    setCreating(null)
    if (!question) return
    setOpen(false)
    editor.update(() => {
      $insertNodeToNearestRoot($createExerciseQuestionNode(question.id))
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aufgabe einfügen</DialogTitle>
          <DialogDescription>Welche Art von Frage? Danach öffnet sich der Editor.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {(Object.keys(QUESTION_KIND_LABELS) as QuestionKind[]).map((kind) => (
            <Button
              key={kind}
              type="button"
              variant="outline"
              className="h-auto justify-start py-2.5 text-left"
              disabled={creating !== null}
              onClick={() => pick(kind)}
            >
              <span className="flex flex-1 flex-col items-start">
                <span className="font-medium">{QUESTION_KIND_LABELS[kind]}</span>
                <span className="text-muted-foreground text-xs font-normal">{KIND_HINTS[kind]}</span>
              </span>
              {creating === kind && <Loader2 className="size-4 animate-spin" />}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
