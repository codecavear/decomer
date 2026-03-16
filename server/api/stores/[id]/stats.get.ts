import { eq, and, count, sql } from 'drizzle-orm'
import { stores, orders, products, reviews } from '../../../database/schema'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const storeId = getRouterParam(event, 'id')

  if (!storeId) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

  const db = getDb()

  // Verify user owns the store
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Only the store owner can view store stats'
    })
  }

  // Get total orders count
  const [orderCountResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.storeId, storeId))

  // Get pending orders count
  const [pendingOrdersResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      eq(orders.status, 'pending')
    ))

  // Get product count
  const [productCountResult] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.storeId, storeId))

  // Get average rating
  const [ratingResult] = await db
    .select({
      average: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
    })
    .from(reviews)
    .where(eq(reviews.storeId, storeId))

  return {
    totalOrders: orderCountResult?.count || 0,
    pendingOrders: pendingOrdersResult?.count || 0,
    totalProducts: productCountResult?.count || 0,
    averageRating: ratingResult?.average ? Number(ratingResult.average).toFixed(1) : '0.0'
  }
})
