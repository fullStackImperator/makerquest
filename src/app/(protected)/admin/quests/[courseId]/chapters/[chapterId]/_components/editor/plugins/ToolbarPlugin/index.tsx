'use client'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  LexicalNode,
  NodeKey,
} from 'lexical'
import {
  $isCodeNode,
  CODE_LANGUAGE_MAP,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
} from '../../nodes/CodeNode'
import { $isListNode, ListNode } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isHeadingNode } from '@lexical/rich-text'
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from '@lexical/selection'
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical'
import { useCallback, useEffect, useState } from 'react'
import { BlockFormatSelect } from './Menus/BlockFormatSelect'
import InsertToolMenu from './Menus/InsertToolMenu'
import TextFormatToggles from './Tools/TextFormatToggles'
import AlignTextMenu from './Menus/AlignTextMenu'
import { IS_MOBILE } from '../../shared/environment'
import { $isMathNode } from '../../nodes/MathNode'
import MathTools from './Tools/MathTools'
import { $isImageNode } from '../../nodes/ImageNodeNew/ImageNode'
import ImageTools from './Tools/ImageTools'
import { $isGraphNode } from '../../nodes/GraphNode'
import { $patchStyle } from '../../nodes/utils'
import {
  ImageDialog,
  GraphDialog,
  SketchDialog,
  TableDialog,
  IFrameDialog,
  LinkDialog,
  LayoutDialog,
  OCRDialog,
  YouTubeDialog,
} from './Dialogs'
import { $isStickyNode } from '../../nodes/StickyNodeNew/StickyNode'
import { $isAlertNode } from '../../nodes/AlertNode/AlertNode'
import { $isIFrameNode } from '../../nodes/IFrameNode/IFrameNode'
import { $isYouTubeNode } from '../../nodes/YouTubeNode'
import { IS_APPLE, $findMatchingParent } from '@lexical/utils'
import { $isTableNode, TableNode } from '../../nodes/TableNode/TableNode'
import TableTools from './Tools/TableTools'
import { $isLinkNode } from '@lexical/link'
import {
  EditorDialogs,
  SetDialogsPayload,
  SET_DIALOGS_COMMAND,
} from './Dialogs/commands'
import { getSelectedNode } from '../../utils/getSelectedNode'
import {
  SPEECH_TO_TEXT_COMMAND,
  SUPPORT_SPEECH_RECOGNITION,
} from '../SpeechToTextPlugin'
import AITools from './Tools/AITools'
import useOnlineStatus from '../../../hooks/useOnlineStatus'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Undo2, Redo2, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = []

  for (const [lang, friendlyName] of Object.entries(
    CODE_LANGUAGE_FRIENDLY_NAME_MAP
  )) {
    options.push([lang, friendlyName])
  }

  return options
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions()

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = useState(editor)
  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>('paragraph')
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null
  )
  const [fontSize, setFontSize] = useState<string>('15px')
  const [fontFamily, setFontFamily] = useState<string>('Roboto')
  const [isRTL, setIsRTL] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [codeLanguage, setCodeLanguage] = useState<string>('')
  const [selectedNode, setSelectedNode] = useState<LexicalNode | null>(null)
  const [selectedTable, setSelectedTable] = useState<TableNode | null>(null)
  const [dialogs, setDialogs] = useState<EditorDialogs>({
    image: { open: false },
    graph: { open: false },
    sketch: { open: false },
    table: { open: false },
    iframe: { open: false },
    link: { open: false },
    layout: { open: false },
    ocr: { open: false },
    youtube: { open: false },
  })
  const [toolbarTrigger, setToolbarTrigger] = useState(false)
  const [isSpeechToText, setIsSpeechToText] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setToolbarTrigger(window.scrollY > 32)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const updateToolbar = useCallback(() => {
    if (!activeEditor) return
    try {
      // Use editor.read() (not editorState.read()) so getActiveEditor() works
      // inside helpers like $isParentElementRTL and $getSelectionStyleValueForProperty.
      // The minified production build of @lexical/selection throws #196 without it.
      activeEditor.read(() => {
        const selection = $getSelection()
        if ($isNodeSelection(selection)) {
          const node = selection.getNodes()[0]
          setSelectedNode(node)
          setSelectedElementKey(null)
          setBlockType('paragraph')
        } else {
          setSelectedNode(null)
        }
        if ($isRangeSelection(selection)) {
          const node = getSelectedNode(selection)
          if ($isLinkNode(node)) setSelectedNode(node)
          const parent = node.getParent()
          if ($isLinkNode(parent)) setSelectedNode(parent)

          const tableNode = $findMatchingParent(
            node,
            $isTableNode
          ) as TableNode | null
          setSelectedTable(tableNode)
          const anchorNode = selection.anchor.getNode()
          const element =
            anchorNode.getKey() === 'root'
              ? anchorNode
              : anchorNode.getTopLevelElementOrThrow()
          const elementKey = element.getKey()
          const elementDOM = activeEditor.getElementByKey(elementKey)

          setIsRTL($isParentElementRTL(selection))

          if (elementDOM !== null) {
            setSelectedElementKey(elementKey)
            if ($isListNode(element)) {
              const parentList = $getNearestNodeOfType<ListNode>(
                anchorNode,
                ListNode
              )
              const type = parentList
                ? parentList.getListType()
                : element.getListType()
              setBlockType(type)
            } else {
              const type = $isHeadingNode(element)
                ? element.getTag()
                : element.getType()
              if (type in blockTypeToBlockName) {
                setBlockType(type as keyof typeof blockTypeToBlockName)
              }
              if ($isCodeNode(element)) {
                const language =
                  element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP
                setCodeLanguage(
                  language ? CODE_LANGUAGE_MAP[language] || language : ''
                )
                return
              }
            }
          }
          setFontSize(
            $getSelectionStyleValueForProperty(selection, 'font-size', '15px')
          )
          setFontFamily(
            $getSelectionStyleValueForProperty(selection, 'font-family', 'Roboto')
          )
        }
      })
    } catch (err) {
      // Editor may not be registered as "active" yet (e.g. right after mount).
      // Toolbar will update on next selection/update.
      if (err instanceof Error && !err.message.includes('Unable to find an active editor')) {
        throw err
      }
    }
  }, [activeEditor])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar()
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor, updateToolbar])

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<boolean>(
        SPEECH_TO_TEXT_COMMAND,
        (payload) => {
          setIsSpeechToText(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [activeEditor, updateToolbar])

  useEffect(() => {
    return activeEditor.registerCommand<SetDialogsPayload>(
      SET_DIALOGS_COMMAND,
      (payload) => {
        setDialogs((prev) => ({ ...prev, ...payload }))
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [activeEditor])

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles)
          const mathNodes = selection.getNodes().filter($isMathNode)
          $patchStyle(mathNodes, styles)
        }
      })
    },
    [activeEditor]
  )

  const onFontSizeSelect = useCallback(
    (value: string) => {
      applyStyleText({ 'font-size': value })
    },
    [applyStyleText]
  )

  const onFontFamilySelect = useCallback(
    (value: string) => {
      applyStyleText({ 'font-family': value })
    },
    [applyStyleText]
  )

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey)
          if ($isCodeNode(node)) {
            node.setLanguage(value)
          }
        }
      })
    },
    [activeEditor, selectedElementKey]
  )

  const FONT_FAMILY_OPTIONS = [
    ['Roboto', 'Roboto'],
    ['KaTeX_Main', 'KaTeX'],
    ['Virgil', 'Virgil'],
    ['Cascadia', 'Cascadia'],
    ['Courier New', 'Courier New'],
    ['Georgia', 'Georgia'],
  ]

  const FONT_SIZE_OPTIONS: [string, string][] = [
    ['10px', '10'],
    ['11px', '11'],
    ['12px', '12'],
    ['13px', '13'],
    ['14px', '14'],
    ['15px', '15'],
    ['16px', '16'],
    ['17px', '17'],
    ['18px', '18'],
    ['19px', '19'],
    ['20px', '20'],
  ]

  const isOnline = useOnlineStatus()

  const showMathTools = $isMathNode(selectedNode)
  const showImageTools = $isImageNode(selectedNode)
  const showTableTools = !!selectedTable
  const showTextTools =
    (!showMathTools && !showImageTools) ||
    $isStickyNode(selectedNode) ||
    $isAlertNode(selectedNode)
  const showCodeTools = blockType === 'code'
  const showTextFormatTools = showTextTools && !showCodeTools
  const showAITools = !!isOnline

  return (
    <>
      <header
        className={cn(
          'editor-toolbar border-b bg-background transition-shadow print:hidden',
          toolbarTrigger
            ? 'fixed top-0 left-0 right-0 z-50 shadow-md'
            : 'sticky z-10'
        )}
        style={toolbarTrigger ? undefined : { top: '80px' }}
      >
        <div className="relative flex flex-wrap items-start justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
              aria-label="Undo"
              disabled={!canUndo}
              onClick={() => {
                activeEditor.dispatchCommand(UNDO_COMMAND, undefined)
              }}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)'}
              aria-label="Redo"
              disabled={!canRedo}
              onClick={() => {
                activeEditor.dispatchCommand(REDO_COMMAND, undefined)
              }}
            >
              <Redo2 className="size-4" />
            </Button>
          </div>
          <div className="mx-auto flex flex-wrap items-center justify-center gap-0.5">
            {showMathTools && (
              <MathTools editor={activeEditor} node={selectedNode} />
            )}
            {showImageTools && (
              <ImageTools editor={activeEditor} node={selectedNode} />
            )}
            {showTextTools && (
              <>
                {blockType in blockTypeToBlockName && (
                  <BlockFormatSelect
                    blockType={blockType}
                    editor={activeEditor}
                  />
                )}
                {showCodeTools && (
                  <Select
                    value={codeLanguage}
                    onValueChange={onCodeLanguageSelect}
                  >
                    <SelectTrigger size="sm" className="h-8 w-auto min-w-[68px]">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {CODE_LANGUAGE_OPTIONS.map(([option, text]) => (
                        <SelectItem key={option} value={option}>
                          {text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {showTextFormatTools && (
                  <Select
                    value={fontFamily}
                    onValueChange={onFontFamilySelect}
                  >
                    <SelectTrigger size="sm" className="h-8 w-auto min-w-[68px] md:min-w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILY_OPTIONS.map(([option, text]) => (
                        <SelectItem key={option} value={option}>
                          {text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {showTextFormatTools && (
                  <Select
                    value={fontSize}
                    onValueChange={onFontSizeSelect}
                  >
                    <SelectTrigger size="sm" className="h-8 w-auto min-w-[68px] md:min-w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZE_OPTIONS.map(([option, text]) => (
                        <SelectItem key={option} value={option}>
                          {text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {showAITools && <AITools editor={activeEditor} />}
                {showTableTools && (
                  <TableTools editor={activeEditor} node={selectedTable} />
                )}
                {showTextFormatTools && (
                  <div className="hidden lg:flex">
                    <TextFormatToggles editor={activeEditor} />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <InsertToolMenu editor={activeEditor} />
            <AlignTextMenu editor={activeEditor} isRTL={isRTL} />
          </div>
        </div>
      </header>
      {toolbarTrigger && (
        <div className="h-[64px] print:hidden" aria-hidden />
      )}
      {!IS_MOBILE && SUPPORT_SPEECH_RECOGNITION ? (
        <Button
          type="button"
          size="sm"
          variant={isSpeechToText ? 'secondary' : 'default'}
          className="fixed bottom-4 right-6 z-50 print:hidden transition-[right] duration-225 ease-in-out md:right-6"
          onClick={() => {
            editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText)
          }}
          aria-label="Speech to text"
        >
          <Mic className="size-4" />
        </Button>
      ) : null}
      <ImageDialog
        editor={activeEditor}
        node={$isImageNode(selectedNode) ? selectedNode : null}
        open={dialogs.image.open}
      />
      <GraphDialog
        editor={activeEditor}
        node={$isGraphNode(selectedNode) ? selectedNode : null}
        open={dialogs.graph.open}
      />
      <SketchDialog
        editor={activeEditor}
        node={$isImageNode(selectedNode) ? selectedNode : null}
        open={dialogs.sketch.open}
      />
      <TableDialog editor={activeEditor} open={dialogs.table.open} />
      <IFrameDialog
        editor={activeEditor}
        node={$isIFrameNode(selectedNode) ? selectedNode : null}
        open={dialogs.iframe.open}
      />
      <LinkDialog
        editor={activeEditor}
        node={$isLinkNode(selectedNode) ? selectedNode : null}
        open={dialogs.link.open}
      />
      <LayoutDialog editor={activeEditor} open={dialogs.layout.open} />
      <OCRDialog editor={activeEditor} open={dialogs.ocr.open} />
      <YouTubeDialog
        editor={activeEditor}
        node={$isYouTubeNode(selectedNode) ? selectedNode : null}
        open={dialogs.youtube.open}
      />
    </>
  )
}

export default function useToolbarPlugin(): null | React.ReactElement {
  return <ToolbarPlugin />
}
