import { redirect } from 'next/navigation'

interface GradingPageProps {
  params: Promise<{ courseId: string }>
}

// Grading moved to the journal workspace. The old page (table with
// "Note" and XP buttons) is kept in git history; revisit after the journal rollout.
const CourseGradingPage = async ({ params }: GradingPageProps) => {
  const { courseId } = await params
  redirect(`/admin/journal?course=${courseId}`)
}

export default CourseGradingPage
