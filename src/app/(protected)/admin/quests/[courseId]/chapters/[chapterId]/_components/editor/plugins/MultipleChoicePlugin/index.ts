import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical'
import { useEffect } from 'react'

import {
  $createMultipleChoiceNode,
  MultipleChoiceNode,
} from '../../nodes/MultipleChoiceNode/MultipleChoiceNode'

// Define the command for inserting the multiple-choice node
export const INSERT_MULTIPLE_CHOICE_COMMAND: LexicalCommand<{
  question: string
  options: string[]
  correctOption: number
}> = createCommand('INSERT_MULTIPLE_CHOICE_COMMAND')

export default function MultipleChoicePlugin(): React.ReactElement | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([MultipleChoiceNode])) {
      throw new Error(
        'MultipleChoicePlugin: MultipleChoiceNode not registered on editor'
      )
    }

    // Register the command to handle inserting the multiple choice node
    return editor.registerCommand<{
      question: string
      options: string[]
      correctOption: number
    }>(
      INSERT_MULTIPLE_CHOICE_COMMAND,
      (payload) => {
        const { question, options, correctOption } = payload
        const multipleChoiceNode = $createMultipleChoiceNode(
          question,
          options,
          correctOption
        )
        $insertNodeToNearestRoot(multipleChoiceNode)

        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return null
}
