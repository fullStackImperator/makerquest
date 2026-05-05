/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  FORMAT_ELEMENT_COMMAND,
  type ElementFormatType,
  LexicalCommand,
} from 'lexical'
import { useEffect } from 'react'

import {
  $createYouTubeNode,
  $isYouTubeNode,
  YouTubeNode,
} from '../../nodes/YouTubeNode'

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_YOUTUBE_COMMAND'
)

export default function YouTubePlugin(): React.ReactElement | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error('YouTubePlugin: YouTubeNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<string>(
        INSERT_YOUTUBE_COMMAND,
        (payload) => {
          const youTubeNode = $createYouTubeNode(payload)
          $insertNodeToNearestRoot(youTubeNode)

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<ElementFormatType>(
        FORMAT_ELEMENT_COMMAND,
        (format) => {
          const selection = $getSelection()
          if (!$isNodeSelection(selection)) return false
          const nodes = selection.getNodes()
          if (nodes.length !== 1 || !$isYouTubeNode(nodes[0])) return false
          const node = nodes[0].getWritable()
          if ($isYouTubeNode(node)) node.setFormat(format)
          return true
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [editor])

  return null
}
