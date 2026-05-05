import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode'
import { NodeKey } from 'lexical'
import * as React from 'react'

export class MultipleChoiceNode extends DecoratorBlockNode {
  __question: string
  __options: string[]
  __correctOption: number

  static getType(): string {
    return 'multiple-choice'
  }

  static clone(node: MultipleChoiceNode): MultipleChoiceNode {
    return new MultipleChoiceNode(
      node.__question,
      node.__options,
      node.__correctOption,
      node.__key,
    )
  }

  static importJSON(
    serializedNode: SerializedDecoratorBlockNode & {
      question: string
      options: string[]
      correctOption: number
    },
  ): MultipleChoiceNode {
    return new MultipleChoiceNode(
      serializedNode.question,
      serializedNode.options,
      serializedNode.correctOption,
    )
  }

  constructor(
    question: string,
    options: string[],
    correctOption: number,
    key?: NodeKey,
  ) {
    super(undefined, key)
    this.__question = question
    this.__options = options
    this.__correctOption = correctOption
  }

  decorate(): React.ReactElement {
    return (
      <MultipleChoiceComponent
        question={this.__question}
        options={this.__options}
        correctOption={this.__correctOption}
      />
    )
  }
}

function MultipleChoiceComponent({
  question,
  options,
  correctOption,
}: {
  question: string
  options: string[]
  correctOption: number
}) {
  return (
    <div>
      <p>{question}</p>
      <ul>
        {options.map((option, index) => (
          <li
            key={index}
            style={{ fontWeight: index === correctOption ? 'bold' : 'normal' }}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Helper function to create the MultipleChoiceNode
export function $createMultipleChoiceNode(
  question: string,
  options: string[],
  correctOption: number
): MultipleChoiceNode {
  return new MultipleChoiceNode(question, options, correctOption)
}
