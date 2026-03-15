import { eq } from 'drizzle-orm'
import { stores } from '../../database/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const db = getDb()

  const userStores = await db.query.stores.findMany({
    where: eq(stores.ownerId, user.id),
    with: {
      locations: true
    },
    orderBy: (stores, { asc }) => [asc(stores.createdAt)]
  })

  return userStores
})
