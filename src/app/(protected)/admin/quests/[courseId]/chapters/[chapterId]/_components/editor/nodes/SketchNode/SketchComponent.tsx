'use client'
import { LexicalEditor, NodeKey } from 'lexical'
import { useEffect, useState } from 'react'
import ImageComponent from '../ImageNodeNew/ImageComponent'

/** Excalidraw scene elements (serialized). Typed as unknown[] to avoid depending on @excalidraw internal type paths. */
type ExcalidrawElementsValue = readonly Record<string, unknown>[]

export const encodeFonts = Promise.all([
  fetch('/excalidraw-assets/Virgil.woff2')
    .then((res) => res.arrayBuffer())
    .then((buffer) => arrayBufferToBase64Font(buffer)),
  fetch('/excalidraw-assets/Cascadia.woff2')
    .then((res) => res.arrayBuffer())
    .then(async (buffer) => arrayBufferToBase64Font(buffer)),
])

const arrayBufferToBase64Font = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  const binary = bytes.reduce(
    (acc, byte) => acc + String.fromCharCode(byte),
    ''
  )
  return `data:font/woff2;base64,${btoa(binary)}`
}

export default function SketchComponent({
  nodeKey,
  width,
  height,
  src,
  altText,
  // value,
  showCaption,
  caption,
}: {
  width: number
  height: number
  src: string
  altText: string
  nodeKey: NodeKey
  value?: ExcalidrawElementsValue
  showCaption: boolean
  caption: LexicalEditor
}): React.ReactElement {
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    async function embedFonts() {
      try {
        const [virgil, cascadia] = await encodeFonts
        const fonts = `@font-face { font-family: 'Virgil'; src: url('${virgil}') format('woff2');} @font-face { font-family: 'Cascadia'; src: url('${cascadia}') format('woff2'); }`
        const encoded = src.substring(src.indexOf(',') + 1)
        const decoded = decodeURIComponent(encoded)
        const serialized = decoded.replace(
          /<style.*?>[\s\S]*<\/style>/,
          `<style class="style-fonts">${fonts}</style>`,
        )
        setSource(`data:image/svg+xml,${encodeURIComponent(serialized)}`)
      } catch (e) {
        console.error(e)
      }
    }
    embedFonts()
  }, [src])

  return (
    <ImageComponent
      nodeKey={nodeKey}
      width={width}
      height={height}
      src={source || src}
      altText={altText}
      showCaption={showCaption}
      caption={caption}
    />
  )
}
