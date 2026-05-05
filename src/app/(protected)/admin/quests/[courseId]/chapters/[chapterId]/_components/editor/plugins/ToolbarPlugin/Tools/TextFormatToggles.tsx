'use client'
import * as React from 'react'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical'
import { $patchStyleText } from '@lexical/selection'
import { IS_APPLE, mergeRegister } from '@lexical/utils'
import { $isLinkNode } from '@lexical/link'
import { useCallback, useEffect, useState } from 'react'
import ColorPicker from './ColorPicker'
import { $isMathNode, type MathNode } from '../../../nodes/MathNode'
import { $patchStyle } from '../../../nodes/utils'
import { getSelectedNode } from '../../../utils/getSelectedNode'
import { SET_DIALOGS_COMMAND } from '../Dialogs/commands'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  Strikethrough,
  Subscript,
  Superscript,
  Link,
  Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TextFormatToggles({
  editor,
  className,
}: {
  editor: LexicalEditor
  sx?: unknown
  className?: string
}): React.ReactElement {
  const [isLink, setIsLink] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isHighlight, setIsHighlight] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsSubscript(selection.hasFormat('subscript'))
      setIsSuperscript(selection.hasFormat('superscript'))
      setIsCode(selection.hasFormat('code'))
      setIsHighlight(selection.hasFormat('highlight'))

      const node = getSelectedNode(selection)
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }
    }
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar()
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor, updateToolbar])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      })
    )
  }, [editor, updateToolbar])

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles)
          const mathNodes = selection
            .getNodes()
            .filter((node) => $isMathNode(node)) as MathNode[]
          $patchStyle(mathNodes, styles)
        }
      })
    },
    [editor]
  )

  const onColorChange = useCallback((key: string, value: string) => {
    const styleKey = key === 'text' ? 'color' : 'background-color'
    applyStyleText({ [styleKey]: value })
  }, [applyStyleText])

  const formatObj = {
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    isSubscript,
    isSuperscript,
    isCode,
    isHighlight,
    isLink,
  }
  const formatKeys = Object.keys(formatObj) as Array<keyof typeof formatObj>
  const formats = formatKeys.reduce(
    (acc, key) => {
      if (formatObj[key]) {
        acc.push(key.toLowerCase().replace('is', ''))
      }
      return acc
    },
    [] as string[]
  )

  const openLinkDialog = () =>
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { link: { open: true } })

  const handleFormat = (value: string) => {
    if (value === 'link') {
      openLinkDialog()
      return
    }
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, value as TextFormatType)
  }

  return (
    <ToggleGroup
      type="multiple"
      value={formats}
      onValueChange={(vals) => {
        // ToggleGroup doesn't give us which one was clicked; we use individual press handlers
      }}
      className={cn('flex flex-wrap gap-0', className)}
      aria-label="Text formatting"
    >
      <ToggleGroupItem
        value="bold"
        variant="outline"
        size="sm"
        title={IS_APPLE ? 'Bold (⌘B)' : 'Bold (Ctrl+B)'}
        aria-label={`Format text as bold. Shortcut: ${IS_APPLE ? '⌘B' : 'Ctrl+B'}`}
        onClick={() => handleFormat('bold')}
        data-state={isBold ? 'on' : 'off'}
      >
        <Bold className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="italic"
        variant="outline"
        size="sm"
        title={IS_APPLE ? 'Italic (⌘I)' : 'Italic (Ctrl+I)'}
        aria-label={`Format text as italics. Shortcut: ${IS_APPLE ? '⌘I' : 'Ctrl+I'}`}
        onClick={() => handleFormat('italic')}
        data-state={isItalic ? 'on' : 'off'}
      >
        <Italic className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="underline"
        variant="outline"
        size="sm"
        title={IS_APPLE ? 'Underline (⌘U)' : 'Underline (Ctrl+U)'}
        onClick={() => handleFormat('underline')}
        data-state={isUnderline ? 'on' : 'off'}
      >
        <UnderlineIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="highlight"
        variant="outline"
        size="sm"
        title="Highlight selected text"
        onClick={() => handleFormat('highlight')}
        data-state={isHighlight ? 'on' : 'off'}
      >
        <Highlighter className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="code"
        variant="outline"
        size="sm"
        title="Format text to inline code"
        onClick={() => handleFormat('code')}
        data-state={isCode ? 'on' : 'off'}
      >
        <Code className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="strikethrough"
        variant="outline"
        size="sm"
        title="Strikethrough"
        onClick={() => handleFormat('strikethrough')}
        data-state={isStrikethrough ? 'on' : 'off'}
      >
        <Strikethrough className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="subscript"
        variant="outline"
        size="sm"
        title="Subscript"
        onClick={() => handleFormat('subscript')}
        data-state={isSubscript ? 'on' : 'off'}
      >
        <Subscript className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="superscript"
        variant="outline"
        size="sm"
        title="Superscript"
        onClick={() => handleFormat('superscript')}
        data-state={isSuperscript ? 'on' : 'off'}
      >
        <Superscript className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="link"
        variant="outline"
        size="sm"
        title="Insert link"
        onClick={openLinkDialog}
        data-state={isLink ? 'on' : 'off'}
      >
        <Link className="size-4" />
      </ToggleGroupItem>
      <ColorPicker onColorChange={onColorChange} />
    </ToggleGroup>
  )
}
