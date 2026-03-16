import { _eq, sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { stores, products } from '../../database/schema'

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const identifier = getRouterParam(event, 'id')

  if (!identifier) {
    throw createError({ statusCode: 400, message: 'Store identifier is required' })
  }

  const db = getDb()
  const isUUID = UUID_REGEX.test(identifier)

  const store = await db.query.stores.findFirst({
    where: isUUID ? _eq(stores.id, identifier) : _eq(stores.slug, identifier),
    with: {
      locations: true,
      schedules: true,
      contacts: true
    }
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  // Allow store owners to see their own store regardless of status
  const session = await getUserSession(event)
  const isOwner = session?.user?.id === store.ownerId

  if (store.status !== 'active' && !isOwner) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  // Get product count
  const [productCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(_eq(products.storeId, store.id))

  return {
    ...store,
    productCount: productCount?.count || 0
  }
})
