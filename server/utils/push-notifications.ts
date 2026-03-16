import type { OrderStatus } from '../database/schema/orders'
import webpush from 'web-push'
import { eq } from 'drizzle-orm'
import { getDb } from './db'
import { pushSubscriptions } from '../database/schema/pushSubscriptions'

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:info@decomer.ar'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )
}

const statusMessages: Record<OrderStatus, { title: string, body: string, icon?: string }> = {
  pending: {
    title: 'Pedido Recibido',
    body: 'Tu pedido ha sido recibido y está siendo procesado',
    icon: '⏳'
  },
  confirmed: {
    title: 'Pedido Confirmado',
    body: 'Tu pedido ha sido confirmado y pronto comenzaremos a prepararlo',
    icon: '✅'
  },
  preparing: {
    title: 'Preparando tu Pedido',
    body: 'Estamos preparando tu pedido con mucho cuidado',
    icon: '👨‍🍳'
  },
  ready: {
    title: 'Pedido Listo',
    body: 'Tu pedido está listo para retirar o será enviado pronto',
    icon: '🎉'
  },
  en_route: {
    title: 'En Camino',
    body: 'Tu pedido está en camino. ¡Llegará pronto!',
    icon: '🚚'
  },
  delivered: {
    title: 'Pedido Entregado',
    body: 'Tu pedido ha sido entregado. ¡Que lo disfrutes!',
    icon: '✨'
  },
  cancelled: {
    title: 'Pedido Cancelado',
    body: 'Tu pedido ha sido cancelado',
    icon: '❌'
  }
}

export async function sendOrderStatusNotification(
  userId: string,
  orderId: string,
  status: OrderStatus
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping push notification')
    return
  }

  const db = getDb()

  // Get user's push subscriptions
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  if (subscriptions.length === 0) {
    console.log('No push subscriptions found for user:', userId)
    return
  }

  const message = statusMessages[status]
  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    icon: message.icon,
    badge: '/icon-badge.png',
    data: {
      orderId,
      status,
      url: `/orders/${orderId}`
    }
  })

  // Send notification to all user's devices
  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          payload
        )
        return { success: true, subscriptionId: subscription.id }
      } catch {
        // If subscription is invalid/expired, remove it
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as { statusCode: number }).statusCode
          if (statusCode === 410 || statusCode === 404) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subscription.id))
            console.log('Removed expired push subscription:', subscription.id)
          }
        }
        throw error
      }
    })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`Push notifications sent: ${successful} successful, ${failed} failed`)

  return {
    total: subscriptions.length,
    successful,
    failed
  }
}
