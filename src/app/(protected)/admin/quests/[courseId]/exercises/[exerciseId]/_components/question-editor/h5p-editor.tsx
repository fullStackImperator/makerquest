'use client'

import { useState } from 'react'
import type { ExerciseQuestion } from '@/generated/client'
import type { H5pSpec } from '@/lib/exercises/types'
import { QuestionEditorShell } from './question-editor-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function deriveOrigin(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

export function H5pEditor({
  question,
  courseId,
  exerciseId,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
}) {
  const spec = question.spec as H5pSpec
  const [embedUrl, setEmbedUrl] = useState(spec.embedUrl ?? '')
  const [wpOrigin, setWpOrigin] = useState(spec.wpOrigin ?? '')
  const [resizerUrl, setResizerUrl] = useState(spec.resizerUrl ?? '')
  const [height, setHeight] = useState(spec.height ?? 640)

  const onSaveSpec = async () => {
    const nextSpec: H5pSpec = {
      embedUrl: embedUrl.trim(),
      wpOrigin: (wpOrigin.trim() || deriveOrigin(embedUrl.trim())).replace(
        /\/$/,
        '',
      ),
      resizerUrl: resizerUrl.trim() || undefined,
      height: Number(height) || 640,
    }
    return {
      spec: JSON.stringify(nextSpec),
      solution: JSON.stringify({}),
    }
  }

  return (
    <QuestionEditorShell
      question={question}
      courseId={courseId}
      exerciseId={exerciseId}
      onSaveSpec={onSaveSpec}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor={`embed-${question.id}`}>H5P Embed-URL</Label>
          <Input
            id={`embed-${question.id}`}
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://deine-wp-seite.de/wp-admin/admin-ajax.php?action=h5p_embed&id=123"
          />
          <p className="text-muted-foreground text-xs">
            Die src der iframe-Einbettung aus WordPress (H5P „Embed“).
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`origin-${question.id}`}>
            WordPress-Origin (Sicherheit)
          </Label>
          <Input
            id={`origin-${question.id}`}
            value={wpOrigin}
            onChange={(e) => setWpOrigin(e.target.value)}
            placeholder={deriveOrigin(embedUrl) || 'https://deine-wp-seite.de'}
          />
          <p className="text-muted-foreground text-xs">
            Nur Ergebnisse von diesem Origin werden akzeptiert. Leer lassen, um
            ihn automatisch aus der Embed-URL abzuleiten.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label htmlFor={`height-${question.id}`}>Höhe (px)</Label>
            <Input
              id={`height-${question.id}`}
              type="number"
              min={200}
              className="w-32"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value) || 640)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor={`resizer-${question.id}`}>
              Resizer-URL (optional)
            </Label>
            <Input
              id={`resizer-${question.id}`}
              value={resizerUrl}
              onChange={(e) => setResizerUrl(e.target.value)}
              placeholder="https://deine-wp-seite.de/wp-content/plugins/h5p/library/js/h5p-resizer.js"
            />
          </div>
        </div>
      </div>
    </QuestionEditorShell>
  )
}
