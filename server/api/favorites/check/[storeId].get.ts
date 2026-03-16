import { _eq, and } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { favorites } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const storeId = getRouterParam(event, 'storeId')

  if (!storeId) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

  const db = getDb()

  const favorite = await db.query.favorites.findFirst({
    where: and(
      _eq(favorites.userId, user.id),
      _eq(favorites.storeId, storeId)
    )
  })

  return { isFavorited: !!favorite }
})
