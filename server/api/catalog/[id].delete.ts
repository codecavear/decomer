import { _eq, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '_Product ID is required'
    })
  }

  // Check product exists and belongs to user
  const existingProduct = await db.query.products.findFirst({
    where: and(
      _eq(products.id, id),
      _eq(products.ownerId, user.id)
    )
  })

  if (!existingProduct) {
    throw createError({
      statusCode: 404,
      message: '_Product not found'
    })
  }

  // Delete the product (cascade will remove store_products entries)
  // Note: orderItems has onDelete: restrict, so this will fail if product has orders
  try {
    await db.delete(products).where(_eq(products.id, id))
  } catch {
    if (error.code === '23503') { // Foreign key violation
      throw createError({
        statusCode: 409,
        message: 'No se puede eliminar el producto porque tiene pedidos asociados'
      })
    }
    throw error
  }

  return {
    success: true,
    message: '_Product deleted successfully'
  }
})
