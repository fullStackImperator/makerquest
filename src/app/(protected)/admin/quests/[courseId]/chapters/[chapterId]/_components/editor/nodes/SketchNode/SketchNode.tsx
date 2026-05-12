/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
  isHTMLElement,
} from 'lexical'
import type React from 'react'
import {
  ImageNode,
  ImagePayload,
  SerializedImageNode,
} from '../ImageNodeNew/ImageNode'
import { $generateHtmlFromNodes } from '../../utils/html'

import SketchComponent from './SketchComponent'

/** Excalidraw scene elements (serialized). Avoids depending on @excalidraw internal type paths. */
type ExcalidrawElementsValue = readonly Record<string, unknown>[]

export type SketchPayload = Spread<
  {
    /**
     * @deprecated The value is now embedded in the src
     */
    value?: ExcalidrawElementsValue
  },
  ImagePayload
>

function convertSketchElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode
    const style = domNode.style.cssText
    const value: ExcalidrawElementsValue = domNode.dataset.value
      ? JSON.parse(domNode.dataset.value)
      : []
    const node = $createSketchNode({
      src,
      altText,
      value,
      style,
      width,
      height,
    })
    return { node }
  }
  return null
}

export type SerializedSketchNode = Spread<
  {
    value?: ExcalidrawElementsValue
    type: 'sketch'
    version: 1
  },
  SerializedImageNode
>

export class SketchNode extends ImageNode {
  __value?: ExcalidrawElementsValue

  static getType(): string {
    return 'sketch'
  }

  static clone(node: SketchNode): SketchNode {
    return new SketchNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__value,
      node.__style,
      node.__showCaption,
      node.__caption,
      node.__key
    )
  }

  static importJSON(serializedNode: SerializedSketchNode): SketchNode {
    const { width, height, src, value, style, showCaption, caption, altText } =
      serializedNode
    const node = $createSketchNode({
      src,
      value,
      width,
      height,
      style,
      showCaption,
      altText,
    })
    try {
      if (caption) {
        const nestedEditor = node.__caption
        const editorState = nestedEditor.parseEditorState(caption.editorState)
        if (!editorState.isEmpty()) {
          nestedEditor.setEditorState(editorState)
        }
      }
    } catch (e) {
      console.error(e)
    }
    return node
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = super.createDOM(editor._config)
    if (element && isHTMLElement(element)) {
      const html = decodeURIComponent(this.__src.split(',')[1])
      element.innerHTML = html.replace(
        /<!-- payload-start -->\s*(.+?)\s*<!-- payload-end -->/,
        ''
      )
      const svg = element.firstElementChild!
      const style = svg.querySelector('style')
      if (style)
        style.innerHTML =
          "@font-face { font-family: 'Virgil'; src: url('/excalidraw-assets/Virgil.woff2') format('woff2');} @font-face { font-family: 'Cascadia'; src: url('/excalidraw-assets/Cascadia.woff2') format('woff2'); }"
      if (this.__width) svg.setAttribute('width', this.__width.toString())
      if (this.__height) svg.setAttribute('height', this.__height.toString())
      if (!this.__showCaption) return { element }
      const caption = document.createElement('figcaption')
      this.__caption.read(() => {
        caption.innerHTML = $generateHtmlFromNodes(this.__caption)
      })
      element.appendChild(caption)
    }
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertSketchElement,
        priority: 0,
      }),
    }
  }

  constructor(
    src: string,
    altText: string,
    width: number,
    height: number,
    value?: ExcalidrawElementsValue,
    style?: string,
    showCaption?: boolean,
    caption?: LexicalEditor,
    key?: NodeKey
  ) {
    super(src, altText, width, height, style, showCaption, caption, key)
    this.__value = value
  }

  exportJSON(): SerializedSketchNode {
    return {
      ...super.exportJSON(),
      value: this.__value,
      type: 'sketch',
      version: 1,
    }
  }

  update(payload: Partial<SketchPayload>): void {
    const writable = this.getWritable()
    super.update(payload)
    writable.__value = payload.value ?? writable.__value
  }

  getValue(): ExcalidrawElementsValue | undefined {
    return this.__value
  }

  decorate(): React.ReactElement {
    return (
      <SketchComponent
        width={this.__width}
        height={this.__height}
        src={this.getSrc()}
        altText={this.getAltText()}
        nodeKey={this.getKey()}
        value={this.getValue()}
        showCaption={this.__showCaption}
        caption={this.__caption}
      />
    )
  }
}

export function $createSketchNode({
  src,
  altText = 'Sketch',
  value,
  key,
  width,
  height,
  style,
  showCaption,
  caption,
}: SketchPayload): SketchNode {
  return new SketchNode(
    src,
    altText,
    width,
    height,
    value,
    style,
    showCaption,
    caption,
    key
  )
}

export function $isSketchNode(
  node: LexicalNode | null | undefined
): node is SketchNode {
  return node instanceof SketchNode
}
