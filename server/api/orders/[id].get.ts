import { eq } from 'drizzle-orm'
import { orders, stores } from '../../database/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Order ID is required' })
  }

  const db = getDb()

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      store: true,
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
    }
  })

  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }

  // Check authorization: user can view their own orders OR store owner can view orders for their store
  const isOwner = order.userId === user.id
  let isStoreOwner = false

  if (!isOwner) {
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, order.storeId)
    })
    isStoreOwner = store?.ownerId === user.id
  }

  if (!isOwner && !isStoreOwner) {
    throw createError({ statusCode: 403, message: 'Not authorized to view this order' })
  }

  return order
})
