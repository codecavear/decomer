import { z } from 'zod'
import { _eq, and } from 'drizzle-orm'
import { reviews, orders } from '../../database/schema'
import { getDb } from '../../utils/db'

const createReviewSchema = z.object({
  storeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, createReviewSchema.parse)

  const db = getDb()

  // Check if user already has a review for this store
  const existingReview = await db.query.reviews.findFirst({
    where: and(
      _eq(reviews.userId, user.id),
      _eq(reviews.storeId, body.storeId)
    )
  })

  if (existingReview) {
    throw createError({
      statusCode: 409,
      message: 'You have already reviewed this store'
    })
  }

  // Check if user has ordered from this store (for verified badge)
  const userOrder = await db.query.orders.findFirst({
    where: and(
      _eq(orders.userId, user.id),
      _eq(orders.storeId, body.storeId)
    )
  })

  const isVerified = !!userOrder

  // Create review
  const [review] = await db.insert(reviews).values({
    userId: user.id,
    storeId: body.storeId,
    rating: body.rating,
    comment: body.comment,
    isVerified
  }).returning()

  // Fetch complete review with user info
  const completeReview = await db.query.reviews.findFirst({
    where: _eq(reviews.id, review.id),
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
