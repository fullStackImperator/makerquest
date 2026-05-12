'use client'
import '@excalidraw/excalidraw/index.css'
import { $getSelection, $setSelection, type LexicalEditor } from 'lexical'
import {
  INSERT_SKETCH_COMMAND,
  type InsertSketchPayload,
} from '../../../SketchPlugin'
import { Suspense, useEffect, useState, memo, useCallback } from 'react'
import { $isSketchNode } from '../../../../nodes/SketchNode/SketchNode'
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  DataURL,
  LibraryItems,
  BinaryFiles,
  AppState,
  BinaryFileData,
} from '@excalidraw/excalidraw/types'
import type { ImportedLibraryData } from '@excalidraw/excalidraw/data/types'
import { SET_DIALOGS_COMMAND } from '../commands'
import { getImageDimensions } from '../../../../nodes/utils'
import useFixedBodyScroll from '../../../../../hooks/useFixedBodyScroll'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import { ImageNode } from '../../../../nodes/ImageNodeNew/ImageNode'
import type {
  ExcalidrawElement,
  ExcalidrawImageElement,
  FileId,
} from '@excalidraw/excalidraw/element/types'
import { ALERT_COMMAND } from '../../../../commands'
import { v4 as uuid } from 'uuid'

function debounce<A extends unknown[], R>(
  fn: (...args: A) => R,
  ms: number
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout>
  return (...args: A) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

/** Deduplicate Excalidraw elements by id so React keys are unique (keeps last occurrence). */
function deduplicateElementsById<T extends { id: string }>(
  elements: readonly T[]
): T[] {
  const byId = new Map<string, T>()
  for (const el of elements) {
    byId.set(el.id, el)
  }
  return Array.from(byId.values())
}

const getExcalidrawModule = () =>
  import('@excalidraw/excalidraw').catch((err) => {
    console.error('Failed to load Excalidraw', err)
    return null
  })

const Excalidraw = dynamic<ExcalidrawProps>(
  () =>
    getExcalidrawModule().then((mod) =>
      mod ? { default: mod.Excalidraw } : { default: () => null }
    ),
  { ssr: false, loading: () => <div className="flex h-64 w-full items-center justify-center text-muted-foreground">Loading Excalidraw…</div> }
)
const AddLibraries = dynamic(() => import('./AddLibraries'), { ssr: false })

export type ExcalidrawElementFragment = { isDeleted?: boolean }
declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH: string
  }
}
if (typeof window !== 'undefined') {
  window.EXCALIDRAW_ASSET_PATH = '/'
}

export const useCallbackRefState = () => {
  const [refValue, setRefValue] = useState<ExcalidrawImperativeAPI | null>(null)
  const refCallback = useCallback(
    (value: ExcalidrawImperativeAPI | null) => setRefValue(value),
    []
  )
  return [refValue, refCallback] as const
}

const themeMode = 'light'

function SketchDialog({
  editor,
  node,
  open,
}: {
  editor: LexicalEditor
  node: ImageNode | null
  open: boolean
}) {
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState()
  const [lastSceneVersion, setLastSceneVersion] = useState(0)


  const insertSketch = (payload: InsertSketchPayload) => {
    if (!$isSketchNode(node)) {
      editor.dispatchCommand(INSERT_SKETCH_COMMAND, payload)
    } else editor.update(() => node.update(payload))
  }

  const handleSubmit = async () => {
    const elements = excalidrawAPI?.getSceneElements()
    const files = excalidrawAPI?.getFiles()
    const mod = await getExcalidrawModule()
    const exportToSvg = mod?.exportToSvg
    if (!elements || !files || !exportToSvg) return
    const element: SVGElement = await exportToSvg({
      appState: { exportEmbedScene: true },
      elements,
      files,
      exportPadding: !node || $isSketchNode(node) ? 16 : 0,
    })
    const serialized = new XMLSerializer().serializeToString(element)
    const src = 'data:image/svg+xml,' + encodeURIComponent(serialized)
    const dimensions = await getImageDimensions(src)
    const showCaption = node?.getShowCaption() ?? true
    const altText = node?.getAltText()
    const caption = node?.getCaption()
    insertSketch({ src, showCaption, ...dimensions, altText, caption })
    closeDialog()
    setTimeout(() => editor.focus(), 0)
  }

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { sketch: { open: false } })
    clearLocalStorage()
  }

  const restoreSelection = () => {
    editor.read(() => {
      const selection = $getSelection()?.clone() ?? null
      editor.update(() => $setSelection(selection))
    })
  }

  const handleClose = async () => {
    function discard() {
      clearLocalStorage()
      closeDialog()
      restoreSelection()
    }
    function cancel() {
      closeDialog()
      restoreSelection()
    }
    const unsavedScene = localStorage.getItem('excalidraw')
    if (unsavedScene) {
      const alert = {
        title: 'Discard unsaved Changes',
        content: 'Are you sure you want to discard unsaved changes?',
        actions: [
          { label: 'Cancel', id: uuid() },
          { label: 'Discard', id: uuid() },
        ],
      }
      editor.dispatchCommand(ALERT_COMMAND, alert)
      const id = await new Promise<string | null>((resolve) => {
        const handler = (event: MouseEvent) => {
          const target = event.target as HTMLElement
          const button = target.closest('button')
          const dialogContent = target.closest('[data-slot="dialog-content"]')
          if (dialogContent && !button) {
            document.addEventListener('click', handler, { once: true })
            return
          }
          resolve(button?.id ?? null)
        }
        setTimeout(() => document.addEventListener('click', handler, { once: true }), 0)
      })
      if (id === alert.actions[1].id) discard()
    } else cancel()
  }

  async function restoreSerializedScene(serialized: string) {
    const scene = JSON.parse(serialized)
    const files = Object.values(scene.files) as BinaryFileData[]
    if (files.length) excalidrawAPI?.addFiles(files)
    const mod = await getExcalidrawModule()
    if (!mod) return
    const { getNonDeletedElements, isLinearElement } = mod
    const raw = getNonDeletedElements(scene.elements).map(
      (element: ExcalidrawElement) =>
        isLinearElement(element)
          ? { ...element, lastCommittedPoint: null }
          : element
    )
    const elements = deduplicateElementsById(raw)
    return excalidrawAPI?.updateScene({
      elements,
      appState: { theme: themeMode },
    })
  }

  const loadSceneOrLibrary = async () => {
    const unsavedScene = localStorage.getItem('excalidraw')
    if (unsavedScene) {
      const alert = {
        title: 'Restore last unsaved Changes',
        content:
          "You've unsaved changes from last session. Do you want to restore them?",
        actions: [
          { label: 'Cancel', id: uuid() },
          { label: 'Restore', id: uuid() },
        ],
      }
      editor.dispatchCommand(ALERT_COMMAND, alert)
      const id = await new Promise<string | null>((resolve) => {
        const handler = (event: MouseEvent) => {
          const target = event.target as HTMLElement
          const button = target.closest('button')
          const dialogContent = target.closest('[data-slot="dialog-content"]')
          if (dialogContent && !button) {
            document.addEventListener('click', handler, { once: true })
            return
          }
          resolve(button?.id ?? null)
        }
        setTimeout(() => document.addEventListener('click', handler, { once: true }), 0)
      })
      if (!id || id === alert.actions[0].id) tryLoadSceneFromNode()
      if (id === alert.actions[1].id) restoreSerializedScene(unsavedScene)
    } else tryLoadSceneFromNode()
  }

  async function tryLoadSceneFromNode() {
    const src = node?.getSrc()
    if (!src) return
    const blob = await (await fetch(src)).blob()
    try {
      const mod = await getExcalidrawModule()
      if (!mod) return
      const { loadSceneOrLibraryFromBlob, MIME_TYPES, getSceneVersion } = mod
      if ($isSketchNode(node)) {
        const elements = node.getValue()
        if (elements) {
          const deduped = deduplicateElementsById(elements as ExcalidrawElement[])
          setLastSceneVersion(getSceneVersion(deduped))
          excalidrawAPI?.updateScene({
            elements: deduped,
            appState: { theme: themeMode },
          })
        } else {
          const contents = await loadSceneOrLibraryFromBlob(
            blob,
            null,
            elements ?? null
          )
          if (contents.type === MIME_TYPES.excalidraw) {
            excalidrawAPI?.addFiles(Object.values(contents.data.files))
            const sceneElements = deduplicateElementsById(contents.data.elements)
            setLastSceneVersion(getSceneVersion(sceneElements))
            excalidrawAPI?.updateScene({
              ...(contents.data as Record<string, unknown>),
              elements: sceneElements,
              appState: { theme: themeMode },
            })
          } else if (contents.type === MIME_TYPES.excalidrawlib) {
            excalidrawAPI?.updateLibrary({
              libraryItems: (contents.data as ImportedLibraryData).libraryItems!,
              openLibraryMenu: true,
            })
          }
        }
      } else {
        convertImagetoSketch(src)
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function convertImagetoSketch(src: string) {
    const now = Date.now()
    const dimensions = {
      width: node?.getWidth() ?? 0,
      height: node?.getHeight() ?? 0,
    }
    if (!dimensions.width || !dimensions.height) {
      const size = await getImageDimensions(src)
      dimensions.width = size.width
      dimensions.height = size.height
    }
    const mod = await getExcalidrawModule()
    if (!mod) return
    const { getSceneVersion } = mod
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        const mimeType = blob.type
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = reader.result
          if (typeof base64data === 'string') {
            const imageElement: ExcalidrawImageElement = {
              type: 'image',
              id: `image-${now}`,
              status: 'saved',
              fileId: now.toString() as FileId,
              version: 2,
              versionNonce: now,
              x: 200,
              y: 200,
              width: dimensions.width,
              height: dimensions.height,
              scale: [1, 1],
              isDeleted: false,
              fillStyle: 'hachure',
              strokeWidth: 1,
              strokeStyle: 'solid',
              roughness: 1,
              opacity: 100,
              groupIds: [],
              strokeColor: '#000000',
              backgroundColor: 'transparent',
              seed: now,
              roundness: null,
              angle: 0,
              index: null,
              frameId: null,
              boundElements: null,
              updated: now,
              locked: false,
              link: null,
              crop: null,
            }
            excalidrawAPI?.addFiles([
              {
                id: now.toString() as FileId,
                mimeType: mimeType as never,
                dataURL: base64data as DataURL,
                created: now,
                lastRetrieved: now,
              },
            ])
            setLastSceneVersion(getSceneVersion([imageElement]))
            excalidrawAPI?.updateScene({
              elements: [imageElement],
              appState: {
                activeTool: {
                  type: 'freedraw',
                  lastActiveTool: null,
                  customType: null,
                  locked: true,
                },
                currentItemStrokeWidth: 0.5,
                theme: themeMode,
              },
            })
          }
        }
        reader.readAsDataURL(blob)
      })
  }

  useEffect(() => {
    if (!excalidrawAPI) return
    if (open) loadSceneOrLibrary()
    // loadSceneOrLibrary is stable; we only want to run when API or open changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI, open])

  const onLibraryChange = async (items: LibraryItems) => {
    if (!items.length) {
      localStorage.removeItem('excalidraw-library')
      return
    }
    localStorage.setItem('excalidraw-library', JSON.stringify(items))
  }

  const saveToLocalStorage = debounce(
    async (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (elements.length === 0) return
      const mod = await getExcalidrawModule()
      if (!mod) return
      const { getSceneVersion } = mod
      const sceneVersion = getSceneVersion(elements)
      if (lastSceneVersion && sceneVersion === lastSceneVersion) return
      setLastSceneVersion(sceneVersion)
      localStorage.setItem(
        'excalidraw',
        JSON.stringify({ elements, files })
      )
    },
    300
  )

  const clearLocalStorage = () => {
    localStorage.removeItem('excalidraw')
  }

  useFixedBodyScroll(open)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()} >
      <DialogContent
        fullScreen
        className="flex flex-col overflow-hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Sketch / Excalidraw</DialogTitle>
        <div className="w-full flex-1 min-h-0 flex flex-col relative">
          <Suspense
            fallback={
              <div className="flex flex-1 w-full items-center justify-center min-h-64">
                <div className="size-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            }
          >
            {open && (
              <div
                key="excalidraw-container"
                className="w-full min-w-3xl flex-1 min-h-0"
                style={{ height: '100%', minHeight: 0 }}
              >
                <Excalidraw
                  excalidrawAPI={excalidrawAPIRefCallback}
                  theme={themeMode}
                  onLibraryChange={onLibraryChange}
                  onChange={saveToLocalStorage}
                  langCode="en"
                />
              </div>
            )}
            {excalidrawAPI && (
              <AddLibraries key="add-libraries" excalidrawAPI={excalidrawAPI} />
            )}
          </Suspense>
        </div>
        <DialogFooter className="shrink-0 border-t bg-background p-4">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {!node ? 'Insert' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default memo(SketchDialog)
