import { eq } from 'drizzle-orm'
import { getDb } from './db'
import { users } from '../database/schema/users'
import { notifications } from '../database/schema/notifications'
import { sendNotification, OrderNotificationTemplates, type NotificationPayload } from './notifications'

interface OrderData {
  id: string
  userId: string
  status: string
  totalAmount: string
  deliveryType: string
  deliveryAddress?: {
    street?: string
    city?: string
  }
  items: Array<{ quantity: number }>
}

/**
 * Send order status notification to user
 */
export async function notifyOrderStatus(order: OrderData, newStatus: string) {
  const db = getDb()

  // Get user phone
  const [user] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1)

  if (!user?.phone) {
    console.log(`[Order Notifications] User ${order.userId} has no phone number`)
    return
  }

  // Determine message based on status
  let message: string | null = null
  let notificationType: string

  const orderNumber = order.id.slice(0, 8)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  switch (newStatus) {
    case 'confirmed':
      message = OrderNotificationTemplates.orderConfirmed(
        orderNumber,
        'Mañana',
        itemCount,
        order.totalAmount
      )
      notificationType = 'order_confirmed'
      break

    case 'en_route':
      if (order.deliveryType === 'delivery') {
        const address = order.deliveryAddress?.street || 'Tu dirección'
        message = OrderNotificationTemplates.orderEnRoute('30-45 minutos', address)
        notificationType = 'order_en_route'
      }
      break

    case 'delivered':
      message = OrderNotificationTemplates.orderDelivered()
      notificationType = 'order_delivered'
      break

    default:
      // No notification for other status changes
      return
  }

  if (!message) return

  try {
    // Create notification record
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: order.userId,
        channel: 'whatsapp', // Prefer WhatsApp over SMS
        type: notificationType,
        to: user.phone,
        message,
        metadata: { orderId: order.id, orderStatus: newStatus },
        status: 'pending'
      })
      .returning()

    // Send notification
    const payload: NotificationPayload = {
      to: user.phone,
      message,
      channel: 'whatsapp',
      metadata: { orderId: order.id }
    }

    const result = await sendNotification(payload)

    // Update notification status
    await db
      .update(notifications)
      .set({
        status: result.success ? 'sent' : 'failed',
        externalId: result.messageId,
        error: result.error,
        sentAt: result.success ? new Date() : null
      })
      .where(eq(notifications.id, notification.id))

    if (result.success) {
      console.log(`[Order Notifications] Sent ${notificationType} to ${user.phone}`)
    } else {
      console.error(`[Order Notifications] Failed to send ${notificationType}: ${result.error}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Order Notifications] Error sending notification:`, errorMessage)
  }
}
