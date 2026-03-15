import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { reviews } from '../../database/schema'
import { getDb } from '../../utils/db'

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional()
}).refine(
  data => data.rating !== undefined || data.comment !== undefined,
  {
    message: 'At least one field (rating or comment) must be provided'
  }
)

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Review ID is required'
    })
  }

  const body = await readValidatedBody(event, updateReviewSchema.parse)

  const db = getDb()

  // Check if review exists and belongs to user
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, id)
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
      message: 'You can only update your own reviews'
    })
  }

  // Update review
  await db.update(reviews)
    .set({
      ...body,
      updatedAt: new Date()
    })
    .where(eq(reviews.id, id))

  // Fetch complete review with user info
  const completeReview = await db.query.reviews.findFirst({
    where: eq(reviews.id, id),
    with: {
      user: {
        columns: {
          name: true,
          avatarUrl: true
        }
      }
    }
  })

  return completeReview
})
