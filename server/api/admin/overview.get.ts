import { gte, and, eq, sql, desc } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { orders, orderItems } from '../../database/schema/orders'
import { users } from '../../database/schema/users'
import { storeSubscriptions } from '../../database/schema/subscriptions'

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)

  const db = getDb()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  // Today's orders count
  const [todayOrdersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(gte(orders.createdAt, today))

  // Pending orders in kitchen (confirmed + preparing)
  const [pendingOrdersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, today),
        sql`${orders.status} IN ('confirmed', 'preparing')`
      )
    )

  // Active customers (with active subscriptions)
  const [activeCustomersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.status, 'active'))

  // Weekly revenue
  const [weeklyRevenueResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, weekAgo),
        eq(orders.paymentStatus, 'paid')
      )
    )

  // Recent orders (last 10)
  const recentOrders = await db
    .select({
      id: orders.id,
      userName: users.name,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${orderItems}
        WHERE ${orderItems.orderId} = ${orders.id}
      )`
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(10)

  return {
    todayOrders: Number(todayOrdersResult?.count || 0),
    pendingOrders: Number(pendingOrdersResult?.count || 0),
    activeCustomers: Number(activeCustomersResult?.count || 0),
    weeklyRevenue: `$${parseFloat(weeklyRevenueResult?.total || '0').toFixed(2)}`,
    recentOrders
  }
})
