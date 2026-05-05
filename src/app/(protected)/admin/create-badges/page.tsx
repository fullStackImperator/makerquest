import { db } from '@/lib/db'
import CreateBadgesClient from './_components/create-badges-client'

const CreateBadgesPage = async () => {
  const badges = await db.badge.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <CreateBadgesClient badges={badges} />
}

export default CreateBadgesPage
