'use client'

import dynamic from 'next/dynamic'
import type { SerializedEditorState, EditorState, LexicalEditor } from 'lexical'
import { useRef } from 'react'
import { resolveLexicalInitialData } from '@/lib/lexical/defaults'

export {
  emptyLexicalState,
  parseLexicalJson,
  resolveLexicalInitialData,
  EMPTY_LEXICAL_STATE,
} from '@/lib/lexical/defaults'

const ChapterEditor = dynamic(
  () =>
    import(
      '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editorMe'
    ).then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex min-h-[120px] items-center justify-center text-sm">
        Editor wird geladen…
      </div>
    ),
  },
)

type LexicalContentEditorProps = {
  initialData: unknown
  editable?: boolean
  onChange?: (
    editorState: EditorState,
    editor: LexicalEditor,
    tags: Set<string>,
  ) => void
  className?: string
}

export function LexicalContentEditor({
  initialData,
  editable = true,
  onChange,
  className,
}: LexicalContentEditorProps) {
  const editorRef = useRef<LexicalEditor | null>(null)
  const editorData = resolveLexicalInitialData(initialData)

  return (
    <div className={className}>
      <ChapterEditor
        editorData={editorData}
        editorEditable={editable}
        editorRef={editorRef}
        onChange={onChange}
      />
    </div>
  )
}
