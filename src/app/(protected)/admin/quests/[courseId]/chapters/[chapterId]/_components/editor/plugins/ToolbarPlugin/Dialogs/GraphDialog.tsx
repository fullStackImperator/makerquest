'use client'
import { LexicalEditor, $setSelection } from 'lexical'
import { INSERT_GRAPH_COMMAND, InsertGraphPayload } from '../../GraphPlugin'
import { GraphNode } from '../../../nodes/GraphNode'
import { memo, useEffect, useId, useRef, useState } from 'react'
import { $getSelection } from 'lexical'
import { SET_DIALOGS_COMMAND } from './commands'
import Script from 'next/script'
import { getImageDimensions } from '../../../nodes/utils'
import useFixedBodyScroll from '../../../../hooks/useFixedBodyScroll'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function GraphDialog({
  editor,
  node,
  open,
}: {
  editor: LexicalEditor
  node: GraphNode | null
  open: boolean
}) {
  const [loading, setLoading] = useState(true)
  const key = useId()

  const parameters = {
    key,
    language: 'en',
    showToolBar: true,
    borderColor: null,
    showMenuBar: true,
    allowStyleBar: true,
    showAlgebraInput: true,
    enableLabelDrags: false,
    enableShiftDragZoom: true,
    capturingThreshold: null,
    showToolBarHelp: true,
    errorDialogsActive: true,
    showTutorialLink: true,
    width: window.innerWidth,
    height: window.innerHeight - 52.5,
    appName: 'suite',
    ggbBase64: node?.getValue() ?? '',
    appletOnLoad() {
      setLoading(false)
    },
  }

  const insertGraph = (payload: InsertGraphPayload) => {
    if (!node) editor.dispatchCommand(INSERT_GRAPH_COMMAND, payload)
    else editor.update(() => node.update(payload))
  }

  const handleSubmit = async () => {
    const app = (window as any).ggbApplet
    const src = await getBase64Src()
    const value = app.getBase64()
    restoreSelection()
    const dimensions = await getImageDimensions(src)
    const showCaption = node?.getShowCaption() ?? true
    insertGraph({ src, value, showCaption, ...dimensions })
    closeDialog()
    setTimeout(() => {
      editor.focus()
    }, 0)
  }

  const getBase64Src = () =>
    new Promise<string>((resolve, reject) => {
      const app = (window as any).ggbApplet
      const xml = app.getXML()
      const subApp = xml.match(/subApp="(.+?)"/)?.[1]
      switch (subApp) {
        case 'graphing':
        case 'geometry':
        case 'cas':
          {
            app.exportSVG((html: string) => {
              const src = 'data:image/svg+xml,' + encodeURIComponent(html)
              resolve(src)
            })
          }
          break
        default: {
          const src = 'data:image/png;base64,' + app.getPNGBase64(1, true, 72)
          resolve(src)
        }
      }
    })

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { graph: { open: false } })
    setLoading(true)
  }

  const restoreSelection = () => {
    editor.read(() => {
      const selection = $getSelection()?.clone() ?? null
      editor.update(() => $setSelection(selection))
    })
  }

  const handleClose = () => {
    closeDialog()
    restoreSelection()
  }

  useFixedBodyScroll(open)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        fullScreen
        className="flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">GeoGebra Graph</DialogTitle>
        {loading && (
          <div className="flex h-full w-full items-center justify-center flex-1 min-h-0">
            <div className="size-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {open && <GeogebraApplet parameters={parameters} />}
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

const GGB_RETRY_MS = 100
const GGB_RETRY_MAX = 30

const GeogebraApplet = memo(
  ({ parameters }: { parameters: any }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const injectedRef = useRef(false)
    const retryCountRef = useRef(0)

    const injectContainer = () => {
      const win = window as Window & {
        GGBApplet?: new (
          params: unknown,
          version: string,
        ) => {
          setHTML5Codebase: (s: string) => void
          inject: (el: HTMLElement | null) => void
        }
      }
      if (typeof win.GGBApplet !== 'function') {
        retryCountRef.current += 1
        if (retryCountRef.current < GGB_RETRY_MAX) {
          setTimeout(injectContainer, GGB_RETRY_MS)
        } else {
          console.error(
            'GeoGebra: GGBApplet not found after loading deployggb.js. Is /geogebra/deployggb.js the correct script?',
          )
        }
        return
      }
      if (!containerRef.current || injectedRef.current) return
      injectedRef.current = true
      try {
        const applet = new win.GGBApplet!(parameters, '5.0')
        applet.setHTML5Codebase('/geogebra/HTML5/5.0/web3d/')
        applet.inject(containerRef.current)
      } catch (e) {
        injectedRef.current = false
        console.error('GeoGebra GGBApplet injection failed:', e)
      }
    }

    const resizeHandler = () =>
      (window as any).ggbApplet?.setSize(
        window.innerWidth,
        window.innerHeight - 52.5,
      )

    useEffect(() => {
      injectedRef.current = false
    }, [parameters.key])

    useEffect(() => {
      window.addEventListener('resize', resizeHandler)
      return () => window.removeEventListener('resize', resizeHandler)
    }, [])

    return (
      <>
        <div
          ref={containerRef}
          className="flex-1 min-h-0 w-full"
          style={{ minHeight: 0 }}
        />
        <Script
          src="/geogebra/deployggb.js"
          strategy="afterInteractive"
          onReady={injectContainer}
        />
      </>
    )
  },
  (prevProps, nextProps) =>
    prevProps.parameters.key === nextProps.parameters.key,
)

GeogebraApplet.displayName = 'GeogebraApplet'
GraphDialog.displayName = 'GraphDialog'

export default memo(GraphDialog)
