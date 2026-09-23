'use client'

import { useEffect, useRef, useState } from 'react'
import type { H5pAnswer, H5pSpec } from '@/lib/exercises/types'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type XApiScore = {
  scaled?: number
  raw?: number
  max?: number
  min?: number
}

type XApiStatement = {
  result?: {
    score?: XApiScore
    completion?: boolean
  }
}

function extractAnswer(statement: XApiStatement): H5pAnswer | null {
  const score = statement.result?.score
  if (!score) return null

  let scaled = typeof score.scaled === 'number' ? score.scaled : undefined
  if (
    scaled === undefined &&
    typeof score.raw === 'number' &&
    typeof score.max === 'number' &&
    score.max > 0
  ) {
    scaled = score.raw / score.max
  }
  if (scaled === undefined) return null

  return {
    scaled: Math.max(0, Math.min(1, scaled)),
    raw: score.raw,
    max: score.max,
    min: score.min,
    statement,
  }
}

export function H5pInput({
  spec,
  value,
  onAnswer,
  disabled,
}: {
  spec: H5pSpec
  value?: H5pAnswer
  onAnswer: (answer: H5pAnswer) => void
  disabled?: boolean
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [lastScaled, setLastScaled] = useState<number | undefined>(
    value?.scaled,
  )

  useEffect(() => {
    if (!spec.wpOrigin) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== spec.wpOrigin) return
      const data = event.data
      if (!data || data.source !== 'h5p' || !data.statement) return

      const answer = extractAnswer(data.statement as XApiStatement)
      if (!answer) return

      setLastScaled(answer.scaled)
      if (!disabled) onAnswer(answer)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [spec.wpOrigin, disabled, onAnswer])

  useEffect(() => {
    if (!spec.resizerUrl) return
    const script = document.createElement('script')
    script.src = spec.resizerUrl
    script.charset = 'UTF-8'
    script.async = true
    document.body.appendChild(script)
    return () => {
      script.remove()
    }
  }, [spec.resizerUrl])

  if (!spec.embedUrl) {
    return (
      <p className="text-muted-foreground text-sm">
        Für diese Aufgabe wurde noch kein H5P-Inhalt hinterlegt.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border">
        <iframe
          ref={iframeRef}
          src={spec.embedUrl}
          className="w-full"
          style={{ height: spec.height ?? 640 }}
          allowFullScreen
          allow="autoplay; fullscreen"
          title="H5P"
        />
      </div>
      {lastScaled !== undefined && (
        <div
          className={cn(
            'text-muted-foreground flex items-center gap-2 text-sm',
            !disabled && 'text-emerald-600',
          )}
        >
          <CheckCircle2 className="size-4" />
          <span>
            Ergebnis erfasst: {Math.round(lastScaled * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}
