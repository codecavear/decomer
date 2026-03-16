// Admin dashboard stats
// GET /api/admin/dashboard

import { eq, and, gte, lte, count, sum } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Sunday

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  try {
    // Orders today
    const ordersToday = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, today),
          lte(schema.orders.createdAt, tomorrow)
        )
      )

    // Revenue today
    const revenueToday = await db
      .select({ total: sum(schema.orders.total) })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, today),
          lte(schema.orders.createdAt, tomorrow),
          eq(schema.orders.status, 'confirmed')
        )
      )

    // Active customers (ordered in last 30 days)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeCustomers = await db
      .selectDistinct({ userId: schema.orders.userId })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, thirtyDaysAgo))

    // Orders this week
    const ordersThisWeek = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, weekStart),
          lte(schema.orders.createdAt, weekEnd)
        )
      )

    // Revenue this week
    const revenueThisWeek = await db
      .select({ total: sum(schema.orders.total) })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, weekStart),
          lte(schema.orders.createdAt, weekEnd),
          eq(schema.orders.status, 'confirmed')
        )
      )

    return {
      today: {
        orders: ordersToday[0]?.count || 0,
        revenue: Number(revenueToday[0]?.total || 0)
      },
      week: {
        orders: ordersThisWeek[0]?.count || 0,
        revenue: Number(revenueThisWeek[0]?.total || 0)
      },
      activeCustomers: activeCustomers.length,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('[Admin Dashboard] Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch dashboard stats'
    })
  }
})
