'use client'

import type {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { $getNodeByKey, DecoratorNode } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { useState } from 'react'
import { ClipboardList, Pencil, Trash2 } from 'lucide-react'

import { QuestionCard } from '@/components/exercises/question-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { lexicalPlainText } from '@/lib/exercises/describe-answer'
import { QUESTION_KIND_LABELS } from '@/lib/exercises/types'
import { QuestionEditor } from '@/app/(protected)/admin/quests/[courseId]/exercises/[exerciseId]/_components/question-editor'
import { ExerciseQuestionProvider, useExerciseQuestions } from '../../context/ExerciseQuestionContext'

export const EXERCISE_QUESTION_NODE_TYPE = 'exercise-question'

export type SerializedExerciseQuestionNode = Spread<
  { questionId: string },
  SerializedLexicalNode
>

function ExerciseQuestionBlock({ questionId, nodeKey }: { questionId: string; nodeKey: NodeKey }) {
  const ctx = useExerciseQuestions()
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const [editOpen, setEditOpen] = useState(false)

  // A just-inserted block opens its editor right away.
  const autoOpen = ctx?.mode === 'teacher' && ctx.autoOpenId === questionId

  if (!ctx) {
    return (
      <div className="text-muted-foreground my-4 rounded-lg border border-dashed p-4 text-sm">
        Aufgabe
      </div>
    )
  }

  if (ctx.mode === 'student') {
    const item = ctx.items.get(questionId)
    if (!item) return null
    return (
      <div className="my-6" contentEditable={false}>
        <QuestionCard
          question={item.question}
          initialState={item.state}
          label="Aufgabe"
          onStateChange={ctx.onStateChange}
        />
      </div>
    )
  }

  const question = ctx.questions.get(questionId)
  const remove = () =>
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove()
    })
  const closeEditor = () => {
    setEditOpen(false)
    ctx.clearAutoOpen()
    ctx.refresh()
  }

  return (
    <div
      className="bg-card my-6 rounded-xl border border-sky-500/40 p-4 shadow-sm"
      contentEditable={false}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ClipboardList className="size-4 text-sky-600" aria-hidden />
        <span className="text-sm font-semibold">Aufgabe</span>
        {question && <Badge variant="secondary">{QUESTION_KIND_LABELS[question.kind]}</Badge>}
        {question && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {question.points} {question.points === 1 ? 'Punkt' : 'Punkte'}
          </span>
        )}
        {isEditable && (
          <div className="ml-auto flex gap-1">
            {question && ctx.exerciseId && (
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Bearbeiten
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" className="text-muted-foreground gap-1.5" onClick={remove}>
              <Trash2 className="size-3.5" />
              Entfernen
            </Button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
        {question
          ? lexicalPlainText(question.prompt) || 'Noch keine Aufgabenstellung – „Bearbeiten“ klicken.'
          : 'Diese Frage wurde gelöscht. Entferne den Block.'}
      </p>

      {question && ctx.exerciseId && (
        <Dialog
          open={editOpen || autoOpen}
          onOpenChange={(open) => (open ? setEditOpen(true) : closeEditor())}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Aufgabe bearbeiten</DialogTitle>
              <DialogDescription>
                Nach „Frage speichern“ das Kapitel mit „Inhalt speichern“ sichern, damit die
                Aufgabe für Schüler sichtbar wird.
              </DialogDescription>
            </DialogHeader>
            {/* No "Aufgabe" blocks inside a question's own texts. */}
            <ExerciseQuestionProvider value={null}>
              <QuestionEditor
                question={question}
                courseId={ctx.courseId}
                exerciseId={ctx.exerciseId}
                onSaved={closeEditor}
              />
            </ExerciseQuestionProvider>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/** An "Aufgabe" inside chapter text; stores only the question id. */
export class ExerciseQuestionNode extends DecoratorNode<React.ReactElement> {
  __questionId: string

  static getType(): string {
    return EXERCISE_QUESTION_NODE_TYPE
  }

  static clone(node: ExerciseQuestionNode): ExerciseQuestionNode {
    return new ExerciseQuestionNode(node.__questionId, node.__key)
  }

  static importJSON(serialized: SerializedExerciseQuestionNode): ExerciseQuestionNode {
    return $createExerciseQuestionNode(serialized.questionId)
  }

  exportJSON(): SerializedExerciseQuestionNode {
    return { type: EXERCISE_QUESTION_NODE_TYPE, version: 1, questionId: this.__questionId }
  }

  constructor(questionId: string, key?: NodeKey) {
    super(key)
    this.__questionId = questionId
  }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  getQuestionId(): string {
    return this.__questionId
  }

  getTextContent(): string {
    return '[Aufgabe]'
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): React.ReactElement {
    return <ExerciseQuestionBlock questionId={this.__questionId} nodeKey={this.getKey()} />
  }
}

export function $createExerciseQuestionNode(questionId: string): ExerciseQuestionNode {
  return new ExerciseQuestionNode(questionId)
}

export function $isExerciseQuestionNode(node: LexicalNode | null | undefined): node is ExerciseQuestionNode {
  return node instanceof ExerciseQuestionNode
}
