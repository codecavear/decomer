import { desc, _eq, and } from 'drizzle-orm'
import { orders, stores } from '../../../database/schema'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const storeId = getRouterParam(event, 'storeId')

  if (!storeId) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

  const db = getDb()

  // Verify user owns the store
  const store = await db.query.stores.findFirst({
    where: _eq(stores.id, storeId)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Only the store owner can view store orders'
    })
  }

  const query = getQuery(event)
  const status = query.status as string | undefined
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  const conditions = [_eq(orders.storeId, storeId)]
  if (status && ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
    conditions.push(_eq(orders.status, status as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'))
  }

  const storeOrders = await db.query.orders.findMany({
    where: and(...conditions),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      },
      items: {
        with: {
          product: true
        }
      }
    },
    orderBy: [desc(orders.createdAt)],
    limit,
    offset
  })

  return storeOrders
})
