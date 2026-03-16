import { _eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }

  const db = getDb()

  // Get the product with store info
  const product = await db.query.products.findFirst({
    where: _eq(products.id, id),
    with: {
      store: true
    }
  })

  if (!product) {
    throw createError({ statusCode: 404, message: '_Product not found' })
  }

  // Check if user owns the store
  if (product.store.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the store owner can delete this product' })
  }

  // Hard delete the product
  await db
    .delete(products)
    .where(_eq(products.id, id))

  return { success: true, message: '_Product deleted successfully' }
})
