import { desc, eq } from 'drizzle-orm'
import { reviews } from '../../database/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const storeId = query.storeId as string

  if (!storeId) {
    throw createError({
      statusCode: 400,
      message: 'storeId query parameter is required'
    })
  }

  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  const db = getDb()

  const storeReviews = await db.query.reviews.findMany({
    where: eq(reviews.storeId, storeId),
    with: {
      user: {
        columns: {
          name: true,
          avatarUrl: true
        }
      }
    },
    orderBy: [desc(reviews.createdAt)],
    limit,
    offset
  })

  return storeReviews
})
