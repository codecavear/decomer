import { _eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../../../utils/db'
import { products, stores, storeProducts } from '../../../../database/schema'

const updateStoreProductSchema = z.object({
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional()
})

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

  // Validate request body
  const body = await readBody(event)
  const parsed = updateStoreProductSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0].message
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

  // Check assignment exists
  const existingAssignment = await db.query.storeProducts.findFirst({
    where: and(
      _eq(storeProducts.productId, productId),
      _eq(storeProducts.storeId, storeId)
    )
  })

  if (!existingAssignment) {
    throw createError({
      statusCode: 404,
      message: '_Product is not assigned to this store'
    })
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (parsed.data.isAvailable !== undefined) updateData.isAvailable = parsed.data.isAvailable
  if (parsed.data.displayOrder !== undefined) updateData.displayOrder = parsed.data.displayOrder

  // Update the assignment
  await db.update(storeProducts)
    .set(updateData)
    .where(and(
      _eq(storeProducts.productId, productId),
      _eq(storeProducts.storeId, storeId)
    ))

  // Return updated assignment
  const updatedAssignment = await db.query.storeProducts.findFirst({
    where: and(
      _eq(storeProducts.productId, productId),
      _eq(storeProducts.storeId, storeId)
    ),
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

  return updatedAssignment
})
