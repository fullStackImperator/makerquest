'use client'
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createCodeNode } from '../../nodes/CodeNode'
// import {
//   INSERT_CHECK_LIST_COMMAND,
//   INSERT_ORDERED_LIST_COMMAND,
//   INSERT_UNORDERED_LIST_COMMAND,
// } from '../../nodes/ListNodeNew'
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '../../nodes/HorizontalRuleNode/HorizontalRuleNode'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import {
  INSERT_TABLE_COMMAND,
  TableNode,
} from '../../nodes/TableNode/TableNode'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  TextNode,
} from 'lexical'
import { useCallback, useMemo, useState } from 'react'
import * as ReactDOM from 'react-dom'

import { INSERT_MATH_COMMAND } from '../MathPlugin'
import { INSERT_STICKY_COMMAND } from '../StickyPlugin'

import { SET_DIALOGS_COMMAND } from '../ToolbarPlugin/Dialogs/commands'
import { ImageNode } from '../../nodes/ImageNodeNew/ImageNode'
import { GraphNode } from '../../nodes/GraphNode'
import { SketchNode } from '../../nodes/SketchNode/SketchNode'
import { StickyNode } from '../../nodes/StickyNodeNew/StickyNode'
import { PageBreakNode } from '../../nodes/PageBreakNode'
import { INSERT_PAGE_BREAK } from '../PageBreakPlugin'
import { IFrameNode } from '../../nodes/IFrameNode/IFrameNode'
import { LayoutContainerNode } from '../../nodes/LayoutNode'
import { AlertNode } from '../../nodes/AlertNode/AlertNode'
import { YouTubeNode } from '../../nodes/YouTubeNode'
import { INSERT_ALERT_COMMAND } from '../AlertPlugin'
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ListOrdered,
  List,
  ListTodo,
  Quote,
  Code,
  Image as ImageIcon,
  Table2,
  Minus,
  SquareFunction,
  Brush,
  StickyNote,
  FileOutput,
  Globe,
  Columns,
  AlertTriangle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  LineChart,
  Youtube,
} from 'lucide-react'

const Heading = (level: number) =>
  level === 1 ? (
    <Heading1 className="size-4" />
  ) : level === 2 ? (
    <Heading2 className="size-4" />
  ) : level === 3 ? (
    <Heading3 className="size-4" />
  ) : (
    <Heading4 className="size-4" />
  )

const FormatAlignIcon = (alignment: string) =>
  alignment === 'left' ? (
    <AlignLeft className="size-4" />
  ) : alignment === 'center' ? (
    <AlignCenter className="size-4" />
  ) : alignment === 'right' ? (
    <AlignRight className="size-4" />
  ) : (
    <AlignJustify className="size-4" />
  )

function IconMenu({
  options,
  selectedIndex,
  setHighlightedIndex,
  selectOptionAndCleanUp,
}: {
  options: ComponentPickerOption[]
  selectedIndex: number | null
  selectOptionAndCleanUp: (option: ComponentPickerOption) => void
  setHighlightedIndex: (index: number) => void
}) {
  return (
    <div className="w-56 mt-3 rounded-md border bg-popover shadow-md print:hidden">
      <ul className="max-h-50 overflow-auto p-1">
        {options.map((option, i: number) => (
          <li key={option.key}>
            <button
              type="button"
              ref={(el) => {
                if (selectedIndex === i) {
                  el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                }
              }}
              onClick={() => {
                setHighlightedIndex(i)
                selectOptionAndCleanUp(option)
              }}
              onMouseEnter={() => {
                setHighlightedIndex(i)
              }}
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer text-left ${
                selectedIndex === i ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              <span className="flex shrink-0 [&_svg]:size-4">
                {option.icon}
              </span>
              <span className="flex-1 truncate">{option.title}</span>
              {option.keyboardShortcut && (
                <span className="text-muted-foreground text-xs shrink-0">
                  {option.keyboardShortcut}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

class ComponentPickerOption extends MenuOption {
  // What shows up in the editor
  title: string
  // Icon for display
  icon?: React.ReactElement
  // For extra searching.
  keywords: Array<string>
  // TBD
  keyboardShortcut?: string
  // What happens when you select this option?
  onSelect: (queryString: string) => void

  constructor(
    title: string,
    options: {
      icon?: React.ReactElement
      keywords?: Array<string>
      keyboardShortcut?: string
      onSelect: (queryString: string) => void
    },
  ) {
    super(title)
    this.title = title
    this.keywords = options.keywords || []
    this.icon = options.icon
    this.keyboardShortcut = options.keyboardShortcut
    this.onSelect = options.onSelect.bind(this)
  }
}

export default function ComponentPickerMenuPlugin(): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)
  const openImageDialog = useCallback(
    () =>
      editor.dispatchCommand(SET_DIALOGS_COMMAND, { image: { open: true } }),
    [editor]
  )
  const openTableDialog = useCallback(
    () =>
      editor.dispatchCommand(SET_DIALOGS_COMMAND, { table: { open: true } }),
    [editor]
  )
  const openGraphDialog = useCallback(
    () =>
      editor.dispatchCommand(SET_DIALOGS_COMMAND, { graph: { open: true } }),
    [editor]
  )
  const openSketchDialog = useCallback(
    () => editor.dispatchCommand(SET_DIALOGS_COMMAND, { sketch: { open: true } }),
    [editor]
  )
  const openIFrameDialog = useCallback(
    () =>
      editor.dispatchCommand(SET_DIALOGS_COMMAND, { iframe: { open: true } }),
    [editor]
  )
  const openLayoutDialog = useCallback(
    () =>
      editor.dispatchCommand(SET_DIALOGS_COMMAND, { layout: { open: true } }),
    [editor]
  )
  const openOCRDialog = useCallback(
    () => editor.dispatchCommand(SET_DIALOGS_COMMAND, { ocr: { open: true } }),
    [editor]
  )
  const openYouTubeDialog = useCallback(
    () =>
      editor.dispatchCommand(SET_DIALOGS_COMMAND, { youtube: { open: true } }),
    [editor]
  )

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  })

  const getDynamicOptions = useCallback(() => {
    const options: Array<ComponentPickerOption> = []
    if (!editor.hasNode(TableNode)) return options
    if (queryString == null) {
      return options
    }

    const fullTableRegex = new RegExp(/^([1-9]|10)x([1-9]|10)$/)
    const partialTableRegex = new RegExp(/^([1-9]|10)x?$/)

    const fullTableMatch = fullTableRegex.exec(queryString)
    const partialTableMatch = partialTableRegex.exec(queryString)

    if (fullTableMatch) {
      const [rows, columns] = fullTableMatch[0]
        .split('x')
        .map((n: string) => parseInt(n, 10))

      options.push(
        new ComponentPickerOption(`${rows}x${columns} Table`, {
          icon: <Table2 className="size-4" />,
          keywords: ['table'],
          keyboardShortcut: `${rows}x${columns}`,
          onSelect: () =>
            // @ts-expect-error Correct types, but since they're dynamic TS doesn't like it.
            editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
        })
      )
    } else if (partialTableMatch) {
      const rows = parseInt(partialTableMatch[0], 10)

      options.push(
        ...Array.from({ length: 5 }, (_, i) => i + 1).map(
          (columns) =>
            new ComponentPickerOption(`${rows}x${columns} Table`, {
              icon: <Table2 className="size-4" />,
              keywords: ['table'],
              keyboardShortcut: `${rows}x${columns}`,
              onSelect: () =>
                // @ts-expect-error Correct types, but since they're dynamic TS doesn't like it.
                editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
            })
        )
      )
    }

    return options
  }, [editor, queryString])

  const options = useMemo(() => {
    const baseOptions = [
      ...Array.from({ length: 4 }, (_, i) => i + 1).map(
        (n) =>
          new ComponentPickerOption(`Heading ${n}`, {
            icon: Heading(n),
            keywords: ['heading', 'header', `h${n}`],
            keyboardShortcut: '#'.repeat(n),
            onSelect: () =>
              editor.update(() => {
                const selection = $getSelection()
                if ($isRangeSelection(selection)) {
                  $setBlocksType(selection, () =>
                    // @ts-expect-error Correct types, but since they're dynamic TS doesn't like it.
                    $createHeadingNode(`h${n}`)
                  )
                }
              }),
          })
      ),
      new ComponentPickerOption('Numbered List', {
        icon: <ListOrdered className="size-4" />,
        keywords: ['numbered list', 'ordered list', 'ol'],
        keyboardShortcut: '1.',
        onSelect: () =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Bulleted List', {
        icon: <List className="size-4" />,
        keywords: ['bulleted list', 'unordered list', 'ul'],
        keyboardShortcut: '*',
        onSelect: () =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Check List', {
        icon: <ListTodo className="size-4" />,
        keywords: ['check list', 'todo list'],
        keyboardShortcut: '[x]',
        onSelect: () =>
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Quote', {
        icon: <Quote className="size-4" />,
        keywords: ['block quote'],
        keyboardShortcut: '>',
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createQuoteNode())
            }
          }),
      }),
      new ComponentPickerOption('Code', {
        icon: <Code className="size-4" />,
        keywords: ['javascript', 'python', 'js', 'codeblock'],
        keyboardShortcut: '```',
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection()

            if ($isRangeSelection(selection)) {
              if (selection.isCollapsed()) {
                $setBlocksType(selection, () => $createCodeNode())
              } else {
                const textContent = selection.getTextContent()
                const codeNode = $createCodeNode()
                selection.insertNodes([codeNode])
                selection.insertRawText(textContent)
              }
            }
          }),
      }),
      new ComponentPickerOption('Divider', {
        icon: <Minus className="size-4" />,
        keywords: ['horizontal rule', 'divider', 'hr'],
        keyboardShortcut: '---',
        onSelect: () =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
      }),
      new ComponentPickerOption('Math', {
        icon: <SquareFunction className="size-4" />,
        keywords: ['equation', 'latex', 'math'],
        keyboardShortcut: '$$',
        onSelect: () =>
          editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' }),
      }),
      new ComponentPickerOption('OCR', {
        icon: <ImageIcon className="size-4" />,
        keywords: ['ocr', 'image', 'text'],
        keyboardShortcut: '/ocr',
        onSelect: openOCRDialog,
      }),
      // new ComponentPickerOption('Graph', {
      //   icon: <LineChart className="size-4" />,
      //   keywords: ['geogebra', 'graph', 'plot', '2d', '3d'],
      //   keyboardShortcut: '/plot',
      //   onSelect: openGraphDialog,
      // }),
      // new ComponentPickerOption('Sketch', {
      //   icon: <Brush className="size-4" />,
      //   keywords: ['excalidraw', 'sketch', 'drawing', 'diagram'],
      //   keyboardShortcut: '/sketch',
      //   onSelect: openSketchDialog,
      // }),
      // new ComponentPickerOption('Image', {
      //   icon: <Image />,
      //   keywords: ['image', 'photo', 'picture', 'img'],
      //   keyboardShortcut: '/img',
      //   onSelect: openImageDialog
      // }),
      // new ComponentPickerOption('Table', {
      //   icon: <Table2 className="size-4" />,
      //   keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
      //   keyboardShortcut: '/3x3',
      //   onSelect: openTableDialog,
      // }),
      // new ComponentPickerOption('Note', {
      //   icon: <StickyNote className="size-4" />,
      //   keywords: ['sticky', 'note', 'sticky note'],
      //   keyboardShortcut: '/note',
      //   onSelect: () =>
      //     editor.dispatchCommand(INSERT_STICKY_COMMAND, undefined),
      // }),
      ...['left', 'center', 'right', 'justify'].map(
        (alignment) =>
          new ComponentPickerOption(`Align ${alignment}`, {
            icon: FormatAlignIcon(alignment),
            keywords: ['align', alignment],
            keyboardShortcut: `/${alignment}`,
            onSelect: () =>
              // @ts-expect-error Correct types, but since they're dynamic TS doesn't like it.
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment),
          })
      ),
    ]

    if (editor.hasNode(ImageNode)) {
      baseOptions.push(
        new ComponentPickerOption('Image', {
          icon: <ImageIcon className="size-4" />,
          keywords: ['image', 'photo', 'picture', 'img'],
          keyboardShortcut: '/img',
          onSelect: openImageDialog,
        })
      )
    }

    if (editor.hasNode(GraphNode)) {
      baseOptions.push(
        new ComponentPickerOption('Graph', {
          icon: <LineChart className="size-4" />,
          keywords: ['geogebra', 'graph', 'plot', '2d', '3d'],
          keyboardShortcut: '/plot',
          onSelect: openGraphDialog,
        })
      )
    }

    if (editor.hasNode(SketchNode)) {
      baseOptions.push(
        new ComponentPickerOption('Sketch', {
          icon: <Brush className="size-4" />,
          keywords: ['excalidraw', 'sketch', 'drawing', 'diagram'],
          keyboardShortcut: '/sketch',
          onSelect: openSketchDialog,
        })
      )
    }

    if (editor.hasNode(StickyNode)) {
      baseOptions.push(
        new ComponentPickerOption('Note', {
          icon: <StickyNote className="size-4" />,
          keywords: ['sticky', 'note', 'sticky note'],
          keyboardShortcut: '/note',
          onSelect: () =>
            editor.dispatchCommand(INSERT_STICKY_COMMAND, undefined),
        })
      )
    }

    if (editor.hasNode(AlertNode)) {
      baseOptions.push(
        new ComponentPickerOption('Alert', {
          icon: <AlertTriangle className="size-4" />,
          keywords: [
            'alert',
            'wichtig',
            'kasten',
            'nachricht',
            'merkkasten',
            'merken',
          ],
          keyboardShortcut: '/alert',
          onSelect: () =>
            editor.dispatchCommand(INSERT_ALERT_COMMAND, undefined),
        })
      )
    }

    if (editor.hasNode(TableNode)) {
      baseOptions.push(
        new ComponentPickerOption('Table', {
          icon: <Table2 className="size-4" />,
          keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
          keyboardShortcut: '/3x3',
          onSelect: openTableDialog,
        })
      )
    }

    if (editor.hasNode(LayoutContainerNode)) {
      baseOptions.push(
        new ComponentPickerOption('Columns', {
          icon: <Columns className="size-4" />,
          keywords: ['columns', 'layout', 'col'],
          keyboardShortcut: '/col',
          onSelect: openLayoutDialog,
        })
      )
    }

    if (editor.hasNode(PageBreakNode)) {
      baseOptions.push(
        new ComponentPickerOption('Page Break', {
          icon: <FileOutput className="size-4" />,
          keywords: ['page break', 'break', 'page'],
          keyboardShortcut: '/page',
          onSelect: () => editor.dispatchCommand(INSERT_PAGE_BREAK, undefined),
        })
      )
    }

    if (editor.hasNode(IFrameNode)) {
      baseOptions.push(
        new ComponentPickerOption('IFrame', {
          icon: <Globe className="size-4" />,
          keywords: ['iframe', 'embed'],
          keyboardShortcut: '/iframe',
          onSelect: openIFrameDialog,
        })
      )
    }

    if (editor.hasNode(YouTubeNode)) {
      baseOptions.push(
        new ComponentPickerOption('YouTube', {
          icon: <Youtube className="size-4" />,
          keywords: ['youtube', 'yt', 'video'],
          keyboardShortcut: '/youtube',
          onSelect: openYouTubeDialog,
        })
      )
    }

    const dynamicOptions = getDynamicOptions()

    return queryString
      ? [
          ...dynamicOptions,
          ...baseOptions.filter((option) => {
            return new RegExp(queryString, 'gi').exec(option.title) ||
              option.keywords != null
              ? option.keywords.some((keyword) =>
                  new RegExp(queryString, 'gi').exec(keyword)
                )
              : false
          }),
        ]
      : baseOptions
  }, [
    editor,
    getDynamicOptions,
    queryString,
    openImageDialog,
    openGraphDialog,
    openSketchDialog,
    openTableDialog,
    openLayoutDialog,
    openOCRDialog,
    openIFrameDialog,
  ])

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string
    ) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove()
        }
        selectedOption.onSelect(matchingString)
        closeMenu()
      })
    },
    [editor]
  )

  return (
    <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(anchorElement, props) =>
        anchorElement.current && options.length
          ? ReactDOM.createPortal(
              <IconMenu {...props} />,
              anchorElement.current
            )
          : null
      }
    />
  )
}
