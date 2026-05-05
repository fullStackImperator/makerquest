'use client'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import {
  $createRangeSelection,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  BaseSelection,
  NodeKey,
  RangeSelection,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import { useEffect, useState } from 'react'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import type { MathfieldElement, MathfieldElementAttributes } from 'mathlive'
import './index.css'
import { $isMathNode } from '.'
import { customizeMathVirtualKeyboard } from './mathVirtualKeyboard'
import { IS_MOBILE } from '../../shared/environment'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required to augment JSX.IntrinsicElements
  namespace JSX {
    interface IntrinsicElements {
      'math-field': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & Partial<MathfieldElementAttributes>,
        MathfieldElement
      >
    }
  }
}

if (typeof window !== 'undefined') {
  window.MathfieldElement.soundsDirectory = null
  window.MathfieldElement.computeEngine = null
  customizeMathVirtualKeyboard()
}

export type MathComponentProps = {
  initialValue: string
  nodeKey: NodeKey
  mathfieldRef: React.RefObject<MathfieldElement | null>
}

export default function MathComponent({
  initialValue,
  nodeKey,
  mathfieldRef: ref,
}: MathComponentProps): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  const [selection, setSelection] = useState<BaseSelection | null>(null)
  const [lastRangeSelection, setLastRangeSelection] =
    useState<RangeSelection | null>(null)
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey)

  useEffect(() => {
    const mathfield = ref.current
    if (!mathfield) return
    if (initialValue !== mathfield.getValue()) {
      mathfield.setValue(initialValue, { silenceNotifications: true })
    }
  }, [initialValue])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const newSelection = editorState.read(() => $getSelection())
        setSelection(newSelection)
        if ($isRangeSelection(newSelection)) {
          setLastRangeSelection(newSelection)
        }
      }),
    )
  }, [])

  useEffect(() => {
    const mathfield = ref.current
    if (!mathfield) return
    // reselect when selection is lost and mathfield is focused
    if (!selection && document.activeElement === mathfield) setSelected(true)
    // focus when node selected
    if (isSelected && !mathfield.hasFocus()) {
      if (!$isNodeSelection(selection)) return
      editor.getEditorState().read(() => {
        const mathNode = $getNodeByKey(nodeKey)
        if (!mathNode) return
        const anchor = lastRangeSelection?.anchor
        if (!anchor) return
        const anchorNode = anchor.getNode()
        const anchorOffset = anchor.offset
        const isParentAnchor = anchorNode === mathNode.getParent()
        const indexWithinParent = mathNode.getIndexWithinParent()
        const isBefore = isParentAnchor
          ? anchorOffset - indexWithinParent === 0
          : anchorNode.isBefore(mathNode)
        mathfield.focus()
        mathfield.executeCommand(
          isBefore ? 'moveToMathfieldStart' : 'moveToMathfieldEnd',
        )
      })
    }
  }, [isSelected])

  useEffect(() => {
    const mathfield = ref.current
    if (!mathfield) return

    mathfield.smartMode = true
    mathfield.mathModeSpace = '\\,'

    // MathLive 0.108+ already maps [Return] → addRowAfter in math mode; appending the same
    // binding causes "Ambiguous key binding [Return]" for layouts like English (international).
    // focus newly created mathfield
    if (isSelected && !mathfield.hasFocus()) {
      const selection = editor.getEditorState().read($getSelection)
      if (!$isNodeSelection(selection)) return
      setTimeout(() => {
        mathfield.focus()
      }, 0)
    }

    mathfield.addEventListener(
      'input',
      (event) => {
        const value = mathfield.getValue()
        editor.update(() => {
          if (value === initialValue) return
          const node = $getNodeByKey(nodeKey)
          if (!$isMathNode(node)) return
          node.setValue(value)
        })
      },
      false,
    )

    mathfield.addEventListener('focus', () => {
      // Defer so toolbar/editor focus logic runs first; then re-focus mathfield and show keyboard.
      // Do not cancel on blur: the toolbar often steals focus when math is selected, which would
      // cancel the timeout and the keyboard would never show. After the delay we reclaim focus.
      setTimeout(() => {
        if (!document.contains(mathfield)) return
        if (document.activeElement !== mathfield) {
          mathfield.focus()
        }
        const mathVirtualKeyboard = window.mathVirtualKeyboard
        // Ensure the virtual keyboard is bound to this mathfield so keystrokes go into it.
        // `showFor` is preferred when available; fall back to `show`.
        const anyVK = mathVirtualKeyboard as any
        if (typeof anyVK.showFor === 'function') {
          anyVK.showFor(mathfield, { animate: true })
        } else {
          mathVirtualKeyboard.show({ animate: true })
        }
        const element = (mathVirtualKeyboard as any).element as HTMLElement
        if (!element) return
        element.ontransitionend = () =>
          mathfield.executeCommand('scrollIntoView')
      }, 100)
    })

    mathfield.addEventListener('click', (event) => {
      setTimeout(() => {
        clearSelection()
        setSelected(true)
        mathfield.focus()
        if (mathfield.selectionIsCollapsed)
          mathfield.position = mathfield.getOffsetFromPoint(
            event.clientX,
            event.clientY,
          )
      }, 0)
    })

    mathfield.addEventListener('keydown', (event) => {
      event.stopPropagation()
    })

    mathfield.addEventListener('move-out', (event) => {
      const direction = event.detail.direction
      const range = document.createRange()
      const selection = window.getSelection()
      const span = mathfield.parentElement!

      switch (direction) {
        case 'backward':
        case 'upward':
          range.setStartBefore(span)
          break
        case 'forward':
        case 'downward':
          range.setStartAfter(span)
          break
      }

      range.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(range)

      editor.update(() => {
        const rangeSelection = $createRangeSelection()
        rangeSelection.applyDOMRange(range)
        $setSelection(rangeSelection)
        if (mathfield.value.trim().length === 0) {
          const node = $getNodeByKey(nodeKey)
          node && node.remove()
        }
      })
    })

    mathfield.addEventListener(
      'contextmenu',
      (event) => {
        if (IS_MOBILE) event.preventDefault()
      },
      { capture: true },
    )
  }, [])

  return (
    <math-field ref={ref}>
      <style>
        {`:host .ML__container { pointer-events: inherit; }
        :host(:not(:focus)) .ML__contains-caret,
        :host(:not(:focus)) .ML__contains-caret * {
          color: inherit;
        }
        @media (hover: none) and (pointer: coarse) {
          :host(:not(:focus)) .ML__container {
            pointer-events: none;
          }
        }`}
      </style>
    </math-field>
  )
}
