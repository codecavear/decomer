import { desc, like } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0
  const search = query.q as string | undefined

  // Build where conditions for user's products

  // Get user's products with their store assignments
  const userProducts = await db.query.products.findMany({
    where: search
      ? (products, { and }) => and(
          eq(products.ownerId, user.id),
          like(products.name, `%${search}%`)
        )
      : eq(products.ownerId, user.id),
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
    },
    orderBy: [desc(products.createdAt)],
    limit,
    offset
  })

  // Get total count for pagination
  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .where(eq(products.ownerId, user.id))

  return {
    products: userProducts,
    total,
    limit,
    offset
  }
})
