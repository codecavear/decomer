import { z } from 'zod'
import { _eq } from 'drizzle-orm'
import { orders, stores, orderStatusEnum } from '../../database/schema'
import { getDb } from '../../utils/db'

const updateOrderSchema = z.object({
  status: z.enum(orderStatusEnum)
})

// Valid status transitions
const statusTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: []
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Order ID is required' })
  }

  const body = await readValidatedBody(event, updateOrderSchema.parse)
  const db = getDb()

  // Fetch order to check authorization and current status
  const order = await db.query.orders.findFirst({
    where: _eq(orders.id, id),
    with: {
      store: true
    }
  })

  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }

  // Check if user is the store owner
  const store = await db.query.stores.findFirst({
    where: _eq(stores.id, order.storeId)
  })

  if (store?.ownerId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Only the store owner can update order status'
    })
  }

  // Validate status transition
  const allowedTransitions = statusTransitions[order.status] || []
  if (!allowedTransitions.includes(body.status)) {
    throw createError({
      statusCode: 400,
      message: `Cannot transition from ${order.status} to ${body.status}`
    })
  }

  // Update order status
  await db
    .update(orders)
    .set({
      status: body.status,
      updatedAt: new Date()
    })
    .where(_eq(orders.id, id))

  // Fetch complete order with relations
  const completeOrder = await db.query.orders.findFirst({
    where: _eq(orders.id, id),
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

  return completeOrder
})
