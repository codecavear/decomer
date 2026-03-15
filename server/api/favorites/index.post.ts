import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { favorites, stores } from '../../database/schema'

const addFavoriteSchema = z.object({
  storeId: z.string().uuid('Invalid store ID')
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, addFavoriteSchema.parse)

  const db = getDb()

  // Check if store exists
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, body.storeId)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  // Check if already favorited
  const existing = await db.query.favorites.findFirst({
    where: and(
      eq(favorites.userId, user.id),
      eq(favorites.storeId, body.storeId)
    )
  })

  // If already favorited, don't error - just return success
  if (existing) {
    return { success: true, alreadyFavorited: true }
  }

  // Add to favorites
  await db.insert(favorites).values({
    userId: user.id,
    storeId: body.storeId
  })

  return { success: true, alreadyFavorited: false }
})
