import { eq, and, gte, inArray, sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { orders, orderItems } from '../../../database/schema/orders'
import { products } from '../../../database/schema/products'

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)

  const db = getDb()

  // Get today's orders with confirmed, preparing, or ready status
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Group products by ID and sum quantities
  const groupedProducts = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      productImage: products.imageUrl,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
      orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        gte(orders.createdAt, today),
        inArray(orders.status, ['confirmed', 'preparing', 'ready'])
      )
    )
    .groupBy(orderItems.productId, products.name, products.imageUrl)
    .orderBy(sql`SUM(${orderItems.quantity}) DESC`)

  return groupedProducts.map(p => ({
    ...p,
    totalQuantity: Number(p.totalQuantity),
    orderCount: Number(p.orderCount)
  }))
})
