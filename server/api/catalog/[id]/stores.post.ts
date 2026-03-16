import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../../utils/db'
import { products, stores, storeProducts } from '../../../database/schema'

const assignStoresSchema = z.object({
  storeIds: z.array(z.string().uuid()).min(1, 'At least one store ID is required')
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  const productId = getRouterParam(event, 'id')
  if (!productId) {
    throw createError({
      statusCode: 400,
      message: '_Product ID is required'
    })
  }

  // Validate request body
  const body = await readBody(event)
  const parsed = assignStoresSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0].message
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
      message: '_Product not found'
    })
  }

  // Verify all stores belong to user
  const userStores = await db.query.stores.findMany({
    where: and(
      inArray(stores.id, parsed.data.storeIds),
      eq(stores.ownerId, user.id)
    )
  })

  if (userStores.length !== parsed.data.storeIds.length) {
    throw createError({
      statusCode: 403,
      message: 'One or more stores do not belong to you'
    })
  }

  // Insert store assignments (ignore duplicates)
  const assignments = parsed.data.storeIds.map(storeId => ({
    productId,
    storeId,
    isAvailable: true,
    displayOrder: 0
  }))

  await db.insert(storeProducts)
    .values(assignments)
    .onConflictDoNothing()

  // Return updated assignments
  const updatedAssignments = await db.query.storeProducts.findMany({
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

  return updatedAssignments
})
