import { eq, and } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { products, storeProducts } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  const productId = getRouterParam(event, 'id')
  if (!productId) {
    throw createError({
      statusCode: 400,
      message: 'Product ID is required'
    })
  }

  // Verify product belongs to user
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.ownerId, user.id)
    )
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }

  // Get store assignments
  const assignments = await db.query.storeProducts.findMany({
    where: eq(storeProducts.productId, productId),
    with: {
      store: {
        columns: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true
        }
      }
    }
  })

  return assignments
})
