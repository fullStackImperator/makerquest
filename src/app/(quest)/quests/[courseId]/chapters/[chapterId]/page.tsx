import { getChapter } from './_actions/get-chapter'
import { Banner } from '@/components/banner'
import { getSessionUser } from '@/lib/get-session-user'
import { redirect } from 'next/navigation'
import { SerializedEditorState } from 'lexical'
import Editor from '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editorMe'

const parseEditorData = (data: unknown): SerializedEditorState | null => {
  if (!data) return null

  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (parsed && typeof parsed === 'object' && 'root' in parsed) {
      return parsed as SerializedEditorState
    }
  } catch (error) {
    console.error('Failed to parse editor data', error)
  }

  return null
}

const ChapterIdPage = async ({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>
}) => {
  const { courseId, chapterId } = await params
  const user = await getSessionUser()

  if (!user) {
    return redirect('/')
  }

  const { chapter, course, userProgress, purchase } = await getChapter({
    userId: user.id,
    courseId,
    chapterId,
  })

  if (!chapter || !course) {
    return redirect('/')
  }

  const isLocked = !chapter.isFree && !purchase

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12">
      {userProgress?.isCompleted && (
        <Banner
          variant="success"
          label="Du hast das Kapitel bereits abgeschlossen."
        />
      )}
      {isLocked && (
        <Banner
          variant="warning"
          label="Du musst dich für den Kurs anmelden."
        />
      )}

      <div className="min-w-0">
        <Editor
          key="readonly-editor"
          editorData={parseEditorData(chapter.mathEditor)}
          editorEditable={false}
        />
      </div>
    </div>
  )
}

export default ChapterIdPage
