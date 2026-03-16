import { _eq, and } from 'drizzle-orm'
import { getDb } from '../../../../utils/db'
import { products, stores, storeProducts } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  const productId = getRouterParam(event, 'id')
  const storeId = getRouterParam(event, 'storeId')

  if (!productId || !storeId) {
    throw createError({
      statusCode: 400,
      message: '_Product ID and Store ID are required'
    })
  }

  // Verify product belongs to user
  const product = await db.query.products.findFirst({
    where: and(
      _eq(products.id, productId),
      _eq(products.ownerId, user.id)
    )
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      message: '_Product not found'
    })
  }

  // Verify store belongs to user
  const store = await db.query.stores.findFirst({
    where: and(
      _eq(stores.id, storeId),
      _eq(stores.ownerId, user.id)
    )
  })

  if (!store) {
    throw createError({
      statusCode: 404,
      message: 'Store not found'
    })
  }

  // Delete the assignment
  await db.delete(storeProducts)
    .where(and(
      _eq(storeProducts.productId, productId),
      _eq(storeProducts.storeId, storeId)
    ))

  return {
    success: true,
    message: '_Product removed from store'
  }
})
