'use client'
import {
  NodeKey,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  $getNodeByKey,
  $setSelection,
} from 'lexical'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import './StickyNode.css'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef, useState } from 'react'
import { editorConfig } from './config'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Trash2, Palette, GripVertical } from 'lucide-react'
import { $isStickyNode } from './StickyNode'

const NestedEditor = dynamic(() => import('../../NestedEditor'), {
  ssr: false,
})

export default function StickyComponent({
  nodeKey,
  color,
  stickyEditor,
}: {
  stickyEditor: LexicalEditor
  color: 'pink' | 'yellow'
  nodeKey: NodeKey
}): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey)

  const stickyContainerRef = useRef<null | HTMLDivElement>(null)

const clearSelection = () => {
  stickyEditor.update(() => {
    $setSelection(null)
  })
}

useEffect(() => {
  return mergeRegister(
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_, activeEditor) => {
        if (activeEditor !== stickyEditor) clearSelection()
        return true
      },
      COMMAND_PRIORITY_LOW,
    ),
  )
}, [isSelected])

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) {
        node.remove()
      }
    })
  }

  const handleColorChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!$isStickyNode(node)) return
      node.toggleColor()
    })
  }

  const onChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!$isStickyNode(node)) return
      node.setEditor(stickyEditor)
    })
  }

  return (
    <div
      ref={stickyContainerRef}
      className="sticky-note-container"
      draggable={isSelected}
      {...{ theme: 'light' }}
    >
      <div className="sticky-tools print:hidden flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          aria-label="Delete sticky note"
          title="Delete"
          className="text-inherit"
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Change sticky note color"
          title="Color"
          onClick={handleColorChange}
          className="text-inherit"
        >
          <Palette className="size-3.5" />
        </Button>
        <Button
          type="button"
          className="drag-btn ml-auto text-inherit"
          variant="ghost"
          size="icon-xs"
          aria-label="Drag sticky note"
          title="Drag"
          onMouseDown={() => setSelected(true)}
          onMouseUp={() => setSelected(false)}
        >
          <GripVertical className="size-3.5" />
        </Button>
      </div>
      <div className={`sticky-note ${color}`}>
        <NestedEditor
          initialEditor={stickyEditor}
          initialNodes={editorConfig.nodes}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
