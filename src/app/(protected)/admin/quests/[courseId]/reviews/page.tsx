import { redirect } from 'next/navigation'

/** Open answers are reviewed per student in the journal workspace ("Aufgaben" tab). */
export default async function ReviewsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  redirect(`/admin/journal?course=${courseId}`)
}
