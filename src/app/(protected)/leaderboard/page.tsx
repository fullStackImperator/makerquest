import { getAllFaecher } from '@/app/(protected)/leaderboard/_actions/get-faecher'
import LeaderboardTabs from './_components/LeaderboardTabs'

export default async function LeaderboardPage() {
  const allFaecher = await getAllFaecher()

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-center text-3xl my-4">Leaderboard</h1>
      <LeaderboardTabs allFaecher={allFaecher} />
    </div>
  )
}
