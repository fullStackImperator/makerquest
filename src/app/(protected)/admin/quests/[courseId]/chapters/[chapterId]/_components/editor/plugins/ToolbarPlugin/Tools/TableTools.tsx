'use client'
import type { LexicalEditor } from 'lexical'
import { $patchStyle, getStyleObjectFromCSS } from '../../../nodes/utils'
import { useEffect, useState } from 'react'
import type { TableNode } from '../../../nodes/TableNode/TableNode'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Table2,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartHorizontal,
  AlignHorizontalSpaceAround,
  AlignEndHorizontal,
  Trash2,
} from 'lucide-react'

export default function TableTools({
  editor,
  node,
}: {
  editor: LexicalEditor
  node: TableNode
}): React.ReactElement {
  function currentNodeStyle(): Record<string, string> | null {
    return editor.read(() => {
      if (!('getStyle' in node)) return null
      const css = node.getStyle()
      if (!css) return null
      return getStyleObjectFromCSS(css)
    })
  }

  const [style, setStyle] = useState<Record<string, string> | null>(
    () => currentNodeStyle()
  )

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 border-border"
        >
          <Table2 className="size-4" />
          <span className="hidden sm:inline">Table</span>
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56"
        aria-label="Table options"
      >
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Align
          </p>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full justify-center"
          >
            <ToggleGroupItem
              value="align-left"
              onClick={() =>
                updateStyle({
                  float: 'none',
                  margin: '0 auto 0 0',
                  'table-layout': 'auto',
                  width: 'auto',
                })
              }
              data-state={style?.margin === '0 auto 0 0' ? 'on' : 'off'}
            >
              <AlignLeft className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="align-center"
              onClick={() =>
                updateStyle({
                  float: 'none',
                  margin: '0 auto',
                  'table-layout': 'auto',
                  width: 'auto',
                })
              }
              data-state={style?.margin === '0 auto' ? 'on' : 'off'}
            >
              <AlignCenter className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="align-right"
              onClick={() =>
                updateStyle({
                  float: 'none',
                  margin: '0 0 0 auto',
                  'table-layout': 'auto',
                  width: 'auto',
                })
              }
              data-state={style?.margin === '0 0 0 auto' ? 'on' : 'off'}
            >
              <AlignRight className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Float
          </p>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full justify-center"
          >
            <ToggleGroupItem
              value="float-left"
              onClick={() =>
                updateStyle({
                  float: 'left',
                  margin: '0 1em 0 0',
                  'table-layout': 'auto',
                  width: 'auto',
                })
              }
              data-state={style?.float === 'left' ? 'on' : 'off'}
            >
              <AlignStartHorizontal className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="float-none"
              onClick={() =>
                updateStyle({
                  float: 'none',
                  margin: '0',
                  'table-layout': 'fixed',
                  width: '100%',
                })
              }
              data-state={
                !style?.float ||
                (style?.float === 'none' && style?.width === '100%')
                  ? 'on'
                  : 'off'
              }
            >
              <AlignHorizontalSpaceAround className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="float-right"
              onClick={() =>
                updateStyle({
                  float: 'right',
                  margin: '0 0 0 1em',
                  'table-layout': 'auto',
                  width: 'auto',
                })
              }
              data-state={style?.float === 'right' ? 'on' : 'off'}
            >
              <AlignEndHorizontal className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious()
              node.remove()
            })
          }}
        >
          <Trash2 className="size-4 mr-2" />
          Delete Table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
