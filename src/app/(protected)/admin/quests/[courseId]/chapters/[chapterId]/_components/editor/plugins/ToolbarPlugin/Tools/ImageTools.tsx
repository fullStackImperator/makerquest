'use client'
import type { LexicalEditor } from 'lexical'
import { ImageNode } from '../../../nodes/ImageNodeNew/ImageNode'
import { $isSketchNode, type SketchNode } from '../../../nodes/SketchNode/SketchNode'
import { $isGraphNode, type GraphNode } from '../../../nodes/GraphNode'
import { $patchStyle, getStyleObjectFromCSS } from '../../../nodes/utils'
import { useEffect, useState } from 'react'
import { SET_DIALOGS_COMMAND } from '../Dialogs/commands'
import { $isIFrameNode, type IFrameNode } from '../../../nodes/IFrameNode/IFrameNode'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Pencil, Captions, CaptionsOff, AlignHorizontalSpaceAround, AlignStartHorizontal, AlignEndHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImageTools({
  editor,
  node,
  className,
}: {
  editor: LexicalEditor
  node: ImageNode | GraphNode | SketchNode | IFrameNode
  sx?: unknown
  className?: string
}): React.ReactElement {
  const openImageDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { image: { open: true } })
  const openGraphDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { graph: { open: true } })
  const openSketchDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { sketch: { open: true } })
  const openIFrameDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { iframe: { open: true } })
  const openDialog = $isGraphNode(node)
    ? openGraphDialog
    : $isSketchNode(node)
      ? openSketchDialog
      : $isIFrameNode(node)
        ? openIFrameDialog
        : openImageDialog

  function currentNodeStyle(): Record<string, string> | null {
    return editor.getEditorState().read(() => {
      if (!('getStyle' in node)) return null
      const css = node.getStyle()
      if (!css) return null
      return getStyleObjectFromCSS(css)
    })
  }

  const [style, setStyle] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const next = currentNodeStyle()
    const t = setTimeout(() => setStyle(next), 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when node changes
  }, [node])

  function updateStyle(newStyle: Record<string, string>) {
    setStyle((prev) => ({ ...prev, ...newStyle }))
    editor.update(() => {
      $patchStyle([node], newStyle)
    })
  }

  const toggleShowCaption = () => {
    editor.update(() => {
      node.setShowCaption(!node.getShowCaption())
    })
  }

  const isImageNode =
    !$isGraphNode(node) && !$isSketchNode(node) && !$isIFrameNode(node)

  return (
    <div className={cn('flex flex-wrap items-center gap-0.5', className)}>
      <ToggleGroup type="multiple" variant="outline" size="sm" className="gap-0">
        <ToggleGroupItem value="edit" onClick={openDialog} aria-label="Edit">
          <Pencil className="size-4" />
        </ToggleGroupItem>
        {isImageNode && (
          <ToggleGroupItem value="sketch" onClick={openSketchDialog} aria-label="Sketch">
            <Pencil className="size-4" />
          </ToggleGroupItem>
        )}
        <ToggleGroupItem
          value="caption"
          onClick={toggleShowCaption}
          data-state={node.getShowCaption() ? 'on' : 'off'}
          aria-label="Toggle caption"
        >
          {node.getShowCaption() ? (
            <Captions className="size-4" />
          ) : (
            <CaptionsOff className="size-4" />
          )}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="delete"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious()
              node.remove()
            })
          }}
          aria-label="Delete"
        >
          <Trash2 className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" variant="outline" size="sm" className="gap-0">
        <ToggleGroupItem
          value="float-left"
          onClick={() => {
            updateStyle({
              float: 'left',
              margin: '0 1em 0 0',
              'max-width': '50%',
            })
          }}
          data-state={style?.float === 'left' ? 'on' : 'off'}
          aria-label="Float left"
        >
          <AlignStartHorizontal className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="float-none"
          onClick={() => updateStyle({ float: 'none', margin: '0', 'max-width': '100%' })}
          data-state={!style?.float || style?.float === 'none' ? 'on' : 'off'}
          aria-label="No float"
        >
          <AlignHorizontalSpaceAround className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="float-right"
          onClick={() => {
            updateStyle({
              float: 'right',
              margin: '0 0 0 1em',
              'max-width': '50%',
            })
          }}
          data-state={style?.float === 'right' ? 'on' : 'off'}
          aria-label="Float right"
        >
          <AlignEndHorizontal className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
