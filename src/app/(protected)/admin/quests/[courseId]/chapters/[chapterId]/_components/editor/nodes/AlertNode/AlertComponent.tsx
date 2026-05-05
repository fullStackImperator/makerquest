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
import './AlertNode.css'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef, useState } from 'react'
import { editorConfig } from './config'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Trash2, Palette, GripVertical } from 'lucide-react'

import { $isAlertNode } from './AlertNode'

const NestedEditor = dynamic(() => import('../../NestedEditor'), { ssr: false })

export default function AlertComponent({
  nodeKey,
  color,
  alertEditor,
}: {
  alertEditor: LexicalEditor
  color: 'pink' | 'yellow' | 'blue' | 'green' | 'red'
  nodeKey: NodeKey
}): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey)

  const clearSelection = () => {
    alertEditor.update(() => {
      $setSelection(null)
    })
  }

  const alertContainerRef = useRef<null | HTMLDivElement>(null)

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          if (activeEditor !== alertEditor) clearSelection()
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
      if (!$isAlertNode(node)) return
      node.toggleColor()
    })
  }

  const onChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!$isAlertNode(node)) return
      node.setEditor(alertEditor)
    })
  }

  return (
    <div
      ref={alertContainerRef}
      className="alert-note-container"
      draggable={isSelected}
      {...{ theme: 'light' }}
    >
      <div className="alert-tools">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          aria-label="Delete alert note"
          title="Delete"
          className="text-inherit print:hidden"
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Change alert color"
          title="Color"
          onClick={handleColorChange}
          className="text-inherit print:hidden"
        >
          <Palette className="size-3.5" />
        </Button>
        <Button
          type="button"
          className="drag-btn ml-auto text-inherit print:hidden"
          variant="ghost"
          size="icon-xs"
          aria-label="Drag alert note"
          title="Drag"
          onMouseDown={() => setSelected(true)}
          onMouseUp={() => setSelected(false)}
        >
          <GripVertical className="size-3.5" />
        </Button>
      </div>
      <div className={`alert-note ${color}`}>
        <NestedEditor
          initialEditor={alertEditor}
          initialNodes={editorConfig.nodes}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
