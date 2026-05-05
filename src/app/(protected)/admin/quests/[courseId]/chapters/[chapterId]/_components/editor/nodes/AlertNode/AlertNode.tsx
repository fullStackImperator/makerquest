/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMExportOutput,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditor,
  SerializedEditorState,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { $getRoot, DecoratorNode, createEditor, isHTMLElement } from 'lexical';
import * as React from 'react';
import { Suspense } from 'react';
import { editorConfig } from './config';
import { $generateHtmlFromNodes } from '../../utils/html';
import AlertComponent from './AlertComponent';

type AlertNoteColor = 'pink' | 'yellow' | 'blue' | 'green' | 'red';

export interface AlertPayload {
  color?: AlertNoteColor;
  /**
* @deprecated use editor instead
*/
  data?: SerializedEditorState;
  editor?: SerializedEditor;
}

export type SerializedAlertNode = Spread<
  {
    color: AlertNoteColor;
    data?: SerializedEditorState;
    editor: SerializedEditor
  },
  SerializedLexicalNode
>;

export class AlertNode extends DecoratorNode<React.ReactElement> {
  __color: AlertNoteColor
  __data?: SerializedEditorState
  __editor: LexicalEditor

  static getType(): string {
    return 'alert'
  }

  static clone(node: AlertNode): AlertNode {
    return new AlertNode(node.__color, node.__editor, node.__key)
  }
  static importJSON(serializedNode: SerializedAlertNode): AlertNode {
    const { color, data, editor } = serializedNode
    const node = $createAlertNode({ color })
    const nestedEditor = node.__editor
    try {
      const editorState = nestedEditor.parseEditorState(
        editor?.editorState ?? data
      )
      if (!editorState.isEmpty()) {
        nestedEditor.setEditorState(editorState)
      }
    } catch (e) {
      console.error(e)
    }
    return node
  }

  constructor(color: AlertNoteColor, editor?: LexicalEditor, key?: NodeKey) {
    super(key)
    this.__editor = editor ?? createEditor(editorConfig)
    this.__color = color
  }

  exportJSON(): SerializedAlertNode {
    return {
      editor: this.__editor.toJSON(),
      color: this.__color,
      type: 'alert',
      version: 1,
    }
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor)
    if (element && isHTMLElement(element)) {
      this.__editor.getEditorState().read(() => {
        const html = $generateHtmlFromNodes(this.__editor)
        element.innerHTML = `<div class="alert-note-container" theme="light"><div class="alert-note ${this.__color}"><div class="nested-contentEditable">${html}</div></div></div>`
      })
    }
    return { element }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'alert-note-wrapper'
    return div
  }

  updateDOM(): false {
    return false
  }

  getEditor(): LexicalEditor {
    return this.__editor
  }

  setEditor(editor: LexicalEditor): void {
    const writable = this.getWritable()
    writable.__editor = editor
  }

  // toggleColor(): void {
  //   const writable = this.getWritable()
  //   writable.__color = writable.__color === 'pink' ? 'yellow' : 'pink'
  // }

  toggleColor(): void {
    const writable = this.getWritable()
    // Define an array of colors
    const colors: AlertNoteColor[] = ['pink', 'yellow', 'blue', 'green', 'red'] // Add more colors as needed
    // Get the current color index or default to 0
    const currentIndex = colors.indexOf(writable.__color)
    // Calculate the next color index
    const nextIndex = (currentIndex + 1) % colors.length
    // Assign the next color
    writable.__color = colors[nextIndex]
  }

  select() {
    const editor = this.getEditor()
    editor.update(() => {
      const root = $getRoot()
      root.selectStart()
    })
  }

  decorate(): React.ReactElement {
    return (
      <Suspense fallback={null}>
        <AlertComponent
          color={this.__color}
          nodeKey={this.getKey()}
          alertEditor={this.__editor}
        />
      </Suspense>
    )
  }

  isIsolated(): true {
    return true
  }
}

export function $isAlertNode(
  node: LexicalNode | null | undefined,
): node is AlertNode {
  return node instanceof AlertNode;
}

export function $createAlertNode(payload?: AlertPayload): AlertNode {
  const color = payload?.color || 'red';
  const node = new AlertNode(color);
  if (payload?.editor) {
    const nestedEditor = node.__editor;
    const editorState = nestedEditor.parseEditorState(payload.editor.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
  }
  return node;
}
