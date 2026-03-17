import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { notifications } from '../../database/schema/notifications'
import { sendNotification, type NotificationPayload } from '../../utils/notifications'

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)

  const db = getDb()
  const body = await readBody(event)

  const { userId, channel, type, to, message, metadata } = body

  if (!userId || !channel || !type || !to || !message) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: userId, channel, type, to, message'
    })
  }

  // Validate channel
  if (!['sms', 'whatsapp', 'email', 'push'].includes(channel)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid channel. Must be: sms, whatsapp, email, or push'
    })
  }

  try {
    // Create notification record
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        channel,
        type,
        to,
        message,
        metadata: metadata || {},
        status: 'pending'
      })
      .returning()

    // Send notification (only SMS/WhatsApp supported for now)
    if (channel === 'sms' || channel === 'whatsapp') {
      const payload: NotificationPayload = {
        to,
        message,
        channel,
        metadata
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

      if (!result.success) {
        throw createError({
          statusCode: 500,
          message: `Failed to send ${channel} notification: ${result.error}`
        })
      }

      return {
        success: true,
        notificationId: notification.id,
        messageId: result.messageId
      }
    }

    // For other channels (email, push), just create the record for now
    return {
      success: true,
      notificationId: notification.id,
      message: `Notification created but ${channel} delivery not implemented yet`
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification'
    throw createError({
      statusCode: 500,
      message: errorMessage
    })
  }
})
