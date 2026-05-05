'use client'
import React, { useState } from 'react'
import type { LexicalEditor } from 'lexical'
import {
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from '../../../nodes/HorizontalRuleNode/HorizontalRuleNode'
import { INSERT_MATH_COMMAND } from '../../MathPlugin'
import { INSERT_STICKY_COMMAND } from '../../StickyPlugin'
import { INSERT_ALERT_COMMAND } from '../../AlertPlugin'
import { SET_DIALOGS_COMMAND } from '../Dialogs/commands'
import { INSERT_COLLAPSIBLE_COMMAND } from '../../CollapsiblePluging'
import { MathNode } from '../../../nodes/MathNode'
import { GraphNode } from '../../../nodes/GraphNode'
import { SketchNode } from '../../../nodes/SketchNode/SketchNode'
import { ImageNode } from '../../../nodes/ImageNodeNew/ImageNode'
import { TableNode } from '../../../nodes/TableNode/TableNode'
import { StickyNode } from '../../../nodes/StickyNodeNew/StickyNode'
import { AlertNode } from '../../../nodes/AlertNode/AlertNode'
import { PageBreakNode } from '../../../nodes/PageBreakNode'
import { INSERT_PAGE_BREAK } from '../../PageBreakPlugin'
import { YouTubeNode } from '../../../nodes/YouTubeNode'
import { IFrameNode } from '../../../nodes/IFrameNode/IFrameNode'
import { LayoutContainerNode } from '../../../nodes/LayoutNode'
import { MultipleChoiceNode } from '../../../nodes/MultipleChoiceNode/MultipleChoiceNode'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Minus,
  ClipboardMinus,
  SquareFunction,
  Brush,
  StickyNote,
  AlertTriangle,
  Image as ImageIcon,
  Table2,
  Globe,
  Columns,
  ChevronRight,
  Youtube,
  ListChecks,
  LineChart,
} from 'lucide-react'

export default function InsertToolMenu({
  editor,
}: {
  editor: LexicalEditor
}): React.ReactElement {
  const [multipleChoiceText, setMultipleChoiceText] = useState('')

  const openImageDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { image: { open: true } })
  const openTableDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { table: { open: true } })
  const openGraphDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { graph: { open: true } })
  const openSketchDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { sketch: { open: true } })
  const openIFrameDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { iframe: { open: true } })
  const openLayoutDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { layout: { open: true } })

  const openYouTubeDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { youtube: { open: true } })

  const menuItem = (
    icon: React.ReactNode,
    label: string,
    shortcut: string,
    onClick: () => void,
  ) => (
    <DropdownMenuItem onClick={onClick}>
      <span className="flex items-center gap-2 flex-1">
        {icon}
        <span>{label}</span>
      </span>
      <span className="text-muted-foreground text-xs ml-2">{shortcut}</span>
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Insert"
          className="h-8 w-8"
        >
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {editor.hasNode(HorizontalRuleNode) &&
          menuItem(<Minus className="size-4" />, 'Divider', '---', () =>
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
          )}
        {editor.hasNode(PageBreakNode) &&
          menuItem(<ClipboardMinus className="size-4" />, 'Page', '/page', () =>
            editor.dispatchCommand(INSERT_PAGE_BREAK, undefined),
          )}
        {editor.hasNode(MathNode) &&
          menuItem(<SquareFunction className="size-4" />, 'Math', '$$', () =>
            editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' }),
          )}
        {editor.hasNode(GraphNode) &&
          menuItem(
            <LineChart className="size-4" />,
            'Graph',
            '/plot',
            openGraphDialog,
          )}
        {editor.hasNode(SketchNode) &&
          menuItem(
            <Brush className="size-4" />,
            'Sketch',
            '/sketch',
            openSketchDialog,
          )}
        {editor.hasNode(ImageNode) &&
          menuItem(
            <ImageIcon className="size-4" />,
            'Image',
            '/img',
            openImageDialog,
          )}
        {editor.hasNode(TableNode) &&
          menuItem(
            <Table2 className="size-4" />,
            'Table',
            '/3x3',
            openTableDialog,
          )}
        {editor.hasNode(LayoutContainerNode) &&
          menuItem(
            <Columns className="size-4" />,
            'Columns',
            '/col',
            openLayoutDialog,
          )}
        <DropdownMenuItem
          onClick={() =>
            editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)
          }
        >
          <span className="flex items-center gap-2 flex-1">
            <ChevronRight className="size-4" />
            Collapsible
          </span>
          <span className="text-muted-foreground text-xs ml-2">/hint</span>
        </DropdownMenuItem>
        {editor.hasNode(AlertNode) &&
          menuItem(
            <AlertTriangle className="size-4" />,
            'Alert',
            '/alert',
            () => editor.dispatchCommand(INSERT_ALERT_COMMAND, undefined),
          )}
        {editor.hasNode(StickyNode) &&
          menuItem(<StickyNote className="size-4" />, 'Note', '/note', () =>
            editor.dispatchCommand(INSERT_STICKY_COMMAND, undefined),
          )}
        {editor.hasNode(IFrameNode) &&
          menuItem(
            <Globe className="size-4" />,
            'IFrame',
            '/iframe',
            openIFrameDialog,
          )}
        {editor.hasNode(YouTubeNode) &&
          menuItem(
            <Youtube className="size-4" />,
            'YouTube',
            '/youtube',
            openYouTubeDialog,
          )}
        {editor.hasNode(MultipleChoiceNode) && (
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex items-center"
              >
                <span className="flex items-center gap-2 flex-1">
                  <ListChecks className="size-4" />
                  Multiple Choice
                </span>
                <span className="text-muted-foreground text-xs ml-2">
                  /multiplechoice
                </span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="sr-only">
                Configure Multiple Choice
              </DialogTitle>
              <div className="space-y-2">
                <Label htmlFor="multiple-choice-url">Multiple Choice</Label>
                <Input
                  id="multiple-choice-url"
                  data-test-id="multiple-choice-modal-url"
                  placeholder="Configure in dialog"
                  onChange={(e) => setMultipleChoiceText(e.target.value)}
                  value={multipleChoiceText}
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  data-test-id="multiple-choice-modal-submit-btn"
                  disabled={!multipleChoiceText.trim()}
                  onClick={() => setMultipleChoiceText('')}
                >
                  Confirm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
