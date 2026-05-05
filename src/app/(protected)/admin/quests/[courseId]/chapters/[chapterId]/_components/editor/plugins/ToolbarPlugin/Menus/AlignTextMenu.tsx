'use client'
import * as React from 'react'
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  type ElementFormatType,
  type LexicalEditor,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
} from 'lucide-react'

export default function AlignTextMenu({
  editor,
  isRTL,
}: {
  editor: LexicalEditor
  isRTL: boolean
}): React.ReactElement {
  /** Captured on align-button pointerdown (before menu steals focus / clears node selection). */
  const decoratorBlockKeysRef = React.useRef<string[] | null>(null)

  const snapshotDecoratorBlocks = () => {
    editor.getEditorState().read(() => {
      const sel = $getSelection()
      if (!$isNodeSelection(sel)) {
        decoratorBlockKeysRef.current = null
        return
      }
      const keys = sel
        .getNodes()
        .filter($isDecoratorBlockNode)
        .map((n) => n.getKey())
      decoratorBlockKeysRef.current = keys.length ? keys : null
    })
  }

  const applyAlignment = (format: ElementFormatType) => {
    const keys = decoratorBlockKeysRef.current
    if (keys?.length) {
      editor.update(() => {
        for (const key of keys) {
          const n = $getNodeByKey(key)
          if ($isDecoratorBlockNode(n)) n.setFormat(format)
        }
      })
      decoratorBlockKeysRef.current = null
      return
    }
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Align Text"
          className="h-8 w-8"
          onPointerDownCapture={snapshotDecoratorBlocks}
        >
          <AlignLeft className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => applyAlignment('left')}>
          <AlignLeft className="size-4 mr-2" />
          Left Align
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyAlignment('center')}>
          <AlignCenter className="size-4 mr-2" />
          Center Align
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyAlignment('right')}>
          <AlignRight className="size-4 mr-2" />
          Right Align
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyAlignment('justify')}>
          <AlignJustify className="size-4 mr-2" />
          Justify Align
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
          }
        >
          {isRTL ? (
            <IndentIncrease className="size-4 mr-2" />
          ) : (
            <IndentDecrease className="size-4 mr-2" />
          )}
          Outdent
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
          }
        >
          {isRTL ? (
            <IndentDecrease className="size-4 mr-2" />
          ) : (
            <IndentIncrease className="size-4 mr-2" />
          )}
          Indent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
