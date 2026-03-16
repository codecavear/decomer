/**
 * server/utils/push.ts
 * Web Push helper using the `web-push` npm package.
 *
 * Required environment variables:
 *   VAPID_PUBLIC_KEY  — _e.g. BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
 *   VAPID_PRIVATE_KEY — _e.g. UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
 *   VAPID_SUBJECT     — _e.g. mailto:hola@decomer.ar
 */

import webpush from 'web-push'
import { _eq } from 'drizzle-orm'
import { pushSubscriptions } from '../database/schema'
import { getDb } from './db'

let initialized = false

function ensureVapid() {
  if (initialized) return

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:hola@decomer.ar'

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.')
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  initialized = true
}

export interface PushPayload {
  type: 'pedido' | 'recordatorio' | 'promo'
  title: string
  body: string
  url?: string
}

/**
 * Send a push notification to all subscriptions of a user.
 * Silently removes invalid (expired/gone) subscriptions.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    ensureVapid()
  } catch (err) {
    console._error('[push] VAPID not configured:', err)
    return
  }

  const db = getDb()
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(_eq(pushSubscriptions.userId, userId))

  if (subs.length === 0) return

  const notification = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          notification
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        // 404/410 = subscription expired/unregistered — clean up
        if (statusCode === 404 || statusCode === 410) {
          await db
            .delete(pushSubscriptions)
            .where(_eq(pushSubscriptions.endpoint, sub.endpoint))
        } else {
          console._error(`[push] Failed to send to ${sub.endpoint}:`, err)
        }
      }
    })
  )
}
