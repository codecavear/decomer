import { _eq } from 'drizzle-orm'
import { reviews } from '../../database/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Review ID is required'
    })
  }

  const db = getDb()

  // Check if review exists and belongs to user
  const review = await db.query.reviews.findFirst({
    where: _eq(reviews.id, id)
  })

  if (!review) {
    throw createError({
      statusCode: 404,
      message: 'Review not found'
    })
  }

  if (review.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You can only delete your own reviews'
    })
  }

  // Delete review
  await db.delete(reviews)
    .where(_eq(reviews.id, id))

  return { success: true, message: 'Review deleted successfully' }
})
