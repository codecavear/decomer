import { desc, _eq, and } from 'drizzle-orm'
import { orders } from '../../database/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  const db = getDb()

  const conditions = [_eq(orders.userId, user.id)]
  if (status && ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
    conditions.push(_eq(orders.status, status as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'))
  }

  const userOrders = await db.query.orders.findMany({
    where: and(...conditions),
    with: {
      store: true,
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

  return userOrders
})
