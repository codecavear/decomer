import { gte, and, eq, sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { orders } from '../../../database/schema/orders'
import { subscriptions } from '../../../database/schema/subscriptions'

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

  // Pending orders (confirmed + preparing)
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
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'))

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

  return {
    todayOrders: Number(todayOrdersResult?.count || 0),
    pendingOrders: Number(pendingOrdersResult?.count || 0),
    activeCustomers: Number(activeCustomersResult?.count || 0),
    weeklyRevenue: `$${parseFloat(weeklyRevenueResult?.total || '0').toFixed(2)}`
  }
})
