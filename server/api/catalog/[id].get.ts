import { eq, and } from 'drizzle-orm'
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

  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      eq(products.ownerId, user.id)
    ),
    with: {
      storeAssignments: {
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
      }
    }
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      message: '_Product not found'
    })
  }

  return product
})
