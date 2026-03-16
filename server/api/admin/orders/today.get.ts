// Orders for today grouped by vianda
// GET /api/admin/orders/today

import { eq, and, gte, lte } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    // Get all orders for today
    const orders = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, today),
          lte(schema.orders.createdAt, tomorrow)
        )
      )
      .orderBy(schema.orders.createdAt)

    // Get user details
    const userIds = [...new Set(orders.map(o => o.userId))]
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userIds[0])) // TODO: use IN query

    const userMap = new Map(users.map(u => [u.id, u]))

    // Group items by vianda
    const viandaMap = new Map<string, {
      viandaId: string
      nombre: string
      totalQuantity: number
      orders: Array<{
        orderId: string
        userName: string
        userPhone: string
        quantity: number
        deliveryAddress: string
        status: string
      }>
    }>()

    for (const order of orders) {
      const user = userMap.get(order.userId)
      const items = order.items as Array<{
        id: string
        nombre: string
        cantidad: number
      }>

      for (const item of items) {
        if (!viandaMap.has(item.id)) {
          viandaMap.set(item.id, {
            viandaId: item.id,
            nombre: item.nombre,
            totalQuantity: 0,
            orders: []
          })
        }

        const viandaData = viandaMap.get(item.id)!
        viandaData.totalQuantity += item.cantidad
        viandaData.orders.push({
          orderId: order.id,
          userName: user?.name || 'Unknown',
          userPhone: user?.phone || '',
          quantity: item.cantidad,
          deliveryAddress: order.deliveryAddress || '',
          status: order.status
        })
      }
    }

    // Convert map to array and sort by total quantity
    const viandasAgrupadas = Array.from(viandaMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)

    return {
      date: today.toISOString().split('T')[0],
      totalOrders: orders.length,
      viandasAgrupadas,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('[Admin Orders Today] Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch today orders'
    })
  }
})
