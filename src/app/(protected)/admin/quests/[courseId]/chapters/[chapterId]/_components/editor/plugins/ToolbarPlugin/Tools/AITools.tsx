'use client'
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND,
  LexicalEditor,
  LexicalNode,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronDown,
  Sparkles,
  Expand,
  Shrink,
  Play,
  ImageIcon,
  RefreshCw,
} from 'lucide-react'
import { useCompletion } from '@ai-sdk/react'
import { SET_DIALOGS_COMMAND } from '../Dialogs/commands'
import { ANNOUNCE_COMMAND, UPDATE_DOCUMENT_COMMAND } from '../../../commands'
import type { Announcement } from '../../../../types'
import { $isCodeNode } from '../../../nodes/CodeNode'
import { $isListNode } from '@lexical/list'
import { cn } from '@/lib/utils'
import type React from 'react'

export default function AITools({
  editor,
  className,
}: {
  editor: LexicalEditor
  className?: string
}): React.ReactElement {
  const promptRef = useRef<HTMLTextAreaElement>(null)

  const { completion, complete, isLoading, stop } = useCompletion({
    api: '/api/completion',
    onError() {
      annouunce({
        message: {
          title: 'Something went wrong',
          subtitle: 'Please try again later',
        },
      })
    },
  })

  const annouunce = useCallback(
    (announcement: Announcement) => {
      editor.dispatchCommand(ANNOUNCE_COMMAND, announcement)
    },
    [editor]
  )

  const [isCollapsed, setIsCollapsed] = useState(true)
  const offset = useRef(0)

  const handlePrompt = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const isNavigatingUp = textarea.selectionStart === 0 && e.key === 'ArrowUp'
    const isNavigatingDown =
      textarea.selectionStart === textarea.value.length && e.key === 'ArrowDown'
    if (!isNavigatingUp && !isNavigatingDown) e.stopPropagation()
    if (isNavigatingDown) textarea.closest('li')?.focus()
    const command = textarea.value
    const isSubmit =
      e.key === 'Enter' && !e.shiftKey && command.trim().length > 0
    if (!isSubmit) return
    e.preventDefault()
    editor.focus()
    editor.read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const anchorNode = selection.anchor.getNode()
      let currentNode: LexicalNode | null | undefined = anchorNode
      let textContent = ''
      while (currentNode && textContent.length < 100) {
        textContent = currentNode.getTextContent() + '\n\n' + textContent
        currentNode =
          currentNode.getPreviousSibling() ||
          currentNode.getParent()?.getPreviousSibling()
      }
      complete(textContent, { body: { option: 'zap', command } })
    })
  }

  const handleRewrite = async () => {
    editor.focus()
    editor.read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const textContent = selection.getTextContent()
      complete(textContent, { body: { option: 'improve' } })
    })
  }

  const handleShorter = async () => {
    editor.focus()
    editor.read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const textContent = selection.getTextContent()
      complete(textContent, { body: { option: 'shorter' } })
    })
  }

  const handleLonger = async () => {
    editor.focus()
    editor.read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const textContent = selection.getTextContent()
      complete(textContent, { body: { option: 'longer' } })
    })
  }

  const handleContinue = async () => {
    editor.focus()
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const anchorNode = selection.anchor.getNode()
      let currentNode: LexicalNode | null | undefined = anchorNode
      let textContent = ''
      while (currentNode && textContent.length < 100) {
        textContent = currentNode.getTextContent() + '\n\n' + textContent
        currentNode =
          currentNode.getPreviousSibling() ||
          currentNode.getParent()?.getPreviousSibling()
      }
      const isCollapsedSel = selection.isCollapsed()
      if (!isCollapsedSel)
        (selection.isBackward() ? selection.anchor : selection.focus)
          .getNode()
          .selectEnd()
      complete(textContent, { body: { option: 'continue' } })
    })
  }

  const handleOCR = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { ocr: { open: true } })
  }

  useEffect(() => {
    const hasCompletion = completion.length > 0
    if (!hasCompletion) return
    const isStarting = offset.current === 0
    let shouldInsertNewlineAfter = false
    editor.update(
      () => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return
        const delta = completion.slice(offset.current)
        offset.current = completion.length
        const anchorNode = selection.anchor.getNode()
        const elementNode = anchorNode.getTopLevelElement()
        const isCodeNode = $isCodeNode(elementNode)
        const isListNode = $isListNode(elementNode)
        const isCollapsed = selection.isCollapsed()
        const isAtNewline =
          selection.anchor.offset === 0 && selection.focus.offset === 0
        const shouldInsertNewlineBefore =
          isStarting &&
          isCollapsed &&
          !isAtNewline &&
          !isCodeNode &&
          !isListNode
        const isEndingInNewline = delta.endsWith('\n')
        if (shouldInsertNewlineBefore && !isCodeNode)
          selection.insertParagraph()
        if (isCodeNode) {
          const language = completion.match(/```(\w+)$/)?.[1]
          if (language) return elementNode.setLanguage(language)
          if (elementNode.getTextContent() === '\n')
            elementNode.getFirstChild()?.remove()
          const isStartingInNewline =
            elementNode.getTextContentSize() === 0 && isEndingInNewline
          const textNode = $createTextNode(
            isStartingInNewline ? delta.trim() : delta
          )
          elementNode.append(textNode).selectEnd()
          const endIndex = elementNode.getTextContent().lastIndexOf('\n```')
          const isEnding = endIndex !== -1
          if (isEnding) {
            let deleteCount = elementNode.getTextContentSize() - endIndex
            while (deleteCount > 0) {
              const lastChild = elementNode.getLastChild<TextNode>()
              if (!lastChild) break
              deleteCount -= lastChild?.getTextContentSize()
              lastChild.remove()
            }
            elementNode
              .insertAfter($createParagraphNode())
              .selectStart()
              .insertParagraph()
          }
        } else selection.insertText(isEndingInNewline ? delta.trimEnd() : delta)
        shouldInsertNewlineAfter =
          isEndingInNewline && (!isCodeNode || isListNode)
      },
      {
        tag: !isStarting ? 'history-merge' : undefined,
        discrete: true,
        onUpdate() {
          if (!shouldInsertNewlineAfter) return
          editor.update(
            () => {
              const selection = $getSelection()
              if (!$isRangeSelection(selection)) return
              const anchorNode = selection.anchor.getNode()
              const elementNode = anchorNode.getTopLevelElement()
              const isListNode = $isListNode(elementNode)
              if (isListNode)
                elementNode.insertAfter($createParagraphNode()).selectStart()
              else selection.insertParagraph()
            },
            { tag: 'history-merge' }
          )
        },
      }
    )
  }, [completion, editor])

  useEffect(() => {
    if (isLoading) return
    const isStarting = offset.current === 0
    if (isStarting) return
    offset.current = 0
    editor.dispatchCommand(UPDATE_DOCUMENT_COMMAND, undefined)
  }, [isLoading, editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          if (isLoading) return false
          const selection = $getSelection()
          setIsCollapsed(selection?.isCollapsed() ?? true)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        () => {
          if (isLoading) stop()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        () => {
          if (isLoading) stop()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (isLoading) stop()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor, isLoading, stop])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="ai-tools-button"
          variant="outline"
          size="sm"
          className={cn('h-9 border-border', className)}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Sparkles className="size-4" />
          )}
          <span className="hidden sm:inline">AI</span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        id="ai-tools-menu"
        align="center"
        className="w-56 pt-0"
        onCloseAutoFocus={(e) => {
          const promptInput = promptRef.current
          if (document.activeElement === promptInput) e.preventDefault()
        }}
      >
        <div
          className="flex flex-col gap-1 p-2"
          onFocusCapture={(e) => {
            const currentTarget = e.currentTarget
            const relatedTarget = e.relatedTarget
            setTimeout(() => {
              const promptInput = promptRef.current
              const isPromptFocused = document.activeElement === promptInput
              if (isPromptFocused) return
              if (relatedTarget !== promptInput) promptInput?.focus()
              else (currentTarget.nextElementSibling as HTMLElement)?.focus()
            }, 0)
          }}
        >
          <Textarea
            ref={promptRef}
            placeholder="What to do?"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            onKeyDown={handlePrompt}
            className="min-h-[60px] resize-none"
          />
        </div>
        <DropdownMenuItem
          disabled={isLoading}
          onSelect={(e) => {
            e.preventDefault()
            handleContinue()
          }}
        >
          <Play className="mr-2 size-4" />
          Continue Writing
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isLoading || isCollapsed}
          onSelect={(e) => {
            e.preventDefault()
            handleRewrite()
          }}
        >
          <RefreshCw className="mr-2 size-4" />
          Rewrite
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isLoading || isCollapsed}
          onSelect={(e) => {
            e.preventDefault()
            handleShorter()
          }}
        >
          <Shrink className="mr-2 size-4" />
          Shorter
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isLoading || isCollapsed}
          onSelect={(e) => {
            e.preventDefault()
            handleLonger()
          }}
        >
          <Expand className="mr-2 size-4" />
          Longer
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isLoading || !isCollapsed}
          onSelect={(e) => {
            e.preventDefault()
            handleOCR()
          }}
        >
          <ImageIcon className="mr-2 size-4" />
          Image to Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
