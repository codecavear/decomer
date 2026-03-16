import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../../../utils/db'
import { orders, orderStatusEnum } from '../../../../database/schema/orders'
import { sendOrderStatusNotification } from '../../../../utils/push-notifications'

const updateOrderSchema = z.object({
  status: z.enum(orderStatusEnum)
})

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)

  const db = getDb()

  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
    })
  }

  const body = await readBody(event)
  const validation = updateOrderSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.issues[0].message
    })
  }

  const { status } = validation.data

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status,
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId))
    .returning()

  if (!updatedOrder) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    })
  }

  // Send push notification to user about status change
  try {
    await sendOrderStatusNotification(updatedOrder.userId, updatedOrder.id, status)
  } catch {
    console.error('Failed to send push notification:', error)
    // Don't fail the request if notification fails
  }

  // TODO: If status is 'ready' or 'en_route' and deliveryType is 'delivery', notify delivery partner (Rappi/PedidosYa integration)

  return updatedOrder
})
