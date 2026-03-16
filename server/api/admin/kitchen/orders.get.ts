import { eq, and, gte, inArray } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { orders, orderItems } from '../../../database/schema/orders'
import { products } from '../../../database/schema/products'
import { users } from '../../../database/schema/users'

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)
  await requireAdminRole(event)

  const db = getDb()

  // Get today's orders with status confirmed, preparing, or ready
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      storeId: orders.storeId,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalAmount: orders.totalAmount,
      deliveryType: orders.deliveryType,
      deliveryAddress: orders.deliveryAddress,
      notes: orders.notes,
      createdAt: orders.createdAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(
      and(
        gte(orders.createdAt, today),
        inArray(orders.status, ['confirmed', 'preparing', 'ready'])
      )
    )
    .orderBy(orders.createdAt)

  // Get items for each order
  const ordersWithItems = await Promise.all(
    activeOrders.map(async (order) => {
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          notes: orderItems.notes,
          productName: products.name,
          productId: products.id
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id))

      return {
        ...order,
        items
      }
    })
  )

  return ordersWithItems
})
