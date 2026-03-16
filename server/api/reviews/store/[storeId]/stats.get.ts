import { eq } from 'drizzle-orm'
import { reviews } from '../../../../database/schema'
import { getDb } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const storeId = getRouterParam(event, 'storeId')

  if (!storeId) {
    throw createError({
      statusCode: 400,
      message: 'Store ID is required'
    })
  }

  const db = getDb()

  // Get all reviews for the store
  const storeReviews = await db.query.reviews.findMany({
    where: eq(reviews.storeId, storeId),
    columns: {
      rating: true
    }
  })

  const totalReviews = storeReviews.length

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    }
  }

  // Calculate average rating
  const totalRating = storeReviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = Number((totalRating / totalReviews).toFixed(2))

  // Calculate rating distribution
  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }

  for (const review of storeReviews) {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++
  }

  return {
    averageRating,
    totalReviews,
    ratingDistribution
  }
})
