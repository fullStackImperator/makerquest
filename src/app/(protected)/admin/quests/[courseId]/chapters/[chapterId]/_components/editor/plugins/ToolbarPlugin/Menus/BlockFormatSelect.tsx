'use client'
import type { LexicalEditor } from 'lexical'
import { $createCodeNode } from '../../../nodes/CodeNode'
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { $isTableSelection } from '../../../nodes/TableNode/TableNode'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
} from 'lucide-react'

const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  quote: 'Quote',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  number: 'Numbered List',
  paragraph: 'Normal',
}

const blockIcons: Record<keyof typeof blockTypeToBlockName, React.ReactNode> = {
  paragraph: <Type className="size-4" />,
  h1: <Heading1 className="size-4" />,
  h2: <Heading2 className="size-4" />,
  h3: <Heading3 className="size-4" />,
  h4: <Heading4 className="size-4" />,
  bullet: <List className="size-4" />,
  number: <ListOrdered className="size-4" />,
  check: <ListTodo className="size-4" />,
  quote: <Quote className="size-4" />,
  code: <Code className="size-4" />,
}

export function BlockFormatSelect({
  editor,
  blockType,
}: {
  blockType: keyof typeof blockTypeToBlockName
  editor: LexicalEditor
}): React.ReactElement {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        $setBlocksType(selection as Parameters<typeof $setBlocksType>[0], () =>
          $createParagraphNode()
        )
      }
    })
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          $setBlocksType(selection as Parameters<typeof $setBlocksType>[0], () =>
            $createHeadingNode(headingSize)
          )
        }
      })
    }
  }

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else {
      formatParagraph()
    }
  }

  const formatCheckList = () => {
    if (blockType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    } else {
      formatParagraph()
    }
  }

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          $setBlocksType(selection as Parameters<typeof $setBlocksType>[0], () =>
            $createQuoteNode()
          )
        }
      })
    }
  }

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection as Parameters<typeof $setBlocksType>[0], () =>
              $createCodeNode()
            )
          } else {
            const textContent = selection.getTextContent()
            const codeNode = $createCodeNode()
            selection.insertNodes([codeNode])
            const sel = $getSelection()
            if ($isRangeSelection(sel)) sel.insertRawText(textContent)
          }
        }
      })
    }
  }

  const handleValueChange = (value: string) => {
    const key = value as keyof typeof blockTypeToBlockName
    switch (key) {
      case 'paragraph':
        formatParagraph()
        break
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        formatHeading(key)
        break
      case 'bullet':
        formatBulletList()
        break
      case 'number':
        formatNumberedList()
        break
      case 'check':
        formatCheckList()
        break
      case 'quote':
        formatQuote()
        break
      case 'code':
        formatCode()
        break
      default:
        break
    }
  }

  return (
    <Select value={blockType} onValueChange={handleValueChange}>
      <SelectTrigger
        size="sm"
        className="h-8 w-auto gap-1.5 [&_svg]:shrink-0"
        aria-label="Formatting options for text style"
      >
        <span className="flex items-center gap-1.5">
          {blockIcons[blockType]}
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paragraph">
          <span className="flex items-center gap-2">
            <Type className="size-4" />
            Normal
          </span>
        </SelectItem>
        <SelectItem value="h1">
          <span className="flex items-center gap-2">
            <Heading1 className="size-4" />
            Heading 1
          </span>
        </SelectItem>
        <SelectItem value="h2">
          <span className="flex items-center gap-2">
            <Heading2 className="size-4" />
            Heading 2
          </span>
        </SelectItem>
        <SelectItem value="h3">
          <span className="flex items-center gap-2">
            <Heading3 className="size-4" />
            Heading 3
          </span>
        </SelectItem>
        <SelectItem value="h4">
          <span className="flex items-center gap-2">
            <Heading4 className="size-4" />
            Heading 4
          </span>
        </SelectItem>
        <SelectItem value="bullet">
          <span className="flex items-center gap-2">
            <List className="size-4" />
            Bullet List
          </span>
        </SelectItem>
        <SelectItem value="number">
          <span className="flex items-center gap-2">
            <ListOrdered className="size-4" />
            Numbered List
          </span>
        </SelectItem>
        <SelectItem value="check">
          <span className="flex items-center gap-2">
            <ListTodo className="size-4" />
            Check List
          </span>
        </SelectItem>
        <SelectItem value="quote">
          <span className="flex items-center gap-2">
            <Quote className="size-4" />
            Quote
          </span>
        </SelectItem>
        <SelectItem value="code">
          <span className="flex items-center gap-2">
            <Code className="size-4" />
            Code Block
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
