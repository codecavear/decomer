import { _eq } from 'drizzle-orm'
import { stores } from '../../database/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const db = getDb()

  const userStore = await db.query.stores.findFirst({
    where: _eq(stores.ownerId, user.id),
    with: {
      locations: true,
      schedules: true,
      contacts: true
    }
  })

  return userStore || null
})
