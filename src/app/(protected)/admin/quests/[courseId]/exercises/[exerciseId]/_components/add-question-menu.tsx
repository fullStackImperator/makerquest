'use client'

import { useRouter } from 'next/navigation'
import type { QuestionKind } from '@/generated/client'
import { QUESTION_KIND_LABELS } from '@/lib/exercises/types'
import { addQuestion } from '../_actions/add-question'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

const KINDS: QuestionKind[] = [
  'MC_SINGLE',
  'FILL_BLANK',
  'SHORT_TEXT',
  'MATH',
  'DRAG_DROP',
]

export function AddQuestionMenu({
  courseId,
  exerciseId,
}: {
  courseId: string
  exerciseId: string
}) {
  const router = useRouter()

  const handleAdd = async (kind: QuestionKind) => {
    const result = await addQuestion(courseId, exerciseId, kind)
    if (result.success) {
      toast.success('Frage hinzugefügt')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 size-4" />
          Frage hinzufügen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {KINDS.map((kind) => (
          <DropdownMenuItem key={kind} onClick={() => handleAdd(kind)}>
            {QUESTION_KIND_LABELS[kind]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
