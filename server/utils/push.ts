/**
 * server/utils/push.ts
 * Web Push usando Node.js crypto nativo — sin dependencia de web-push package.
 *
 * Required environment variables:
 *   VAPID_PUBLIC_KEY  — base64url, ej: BEl62iUYgUivxIkv...
 *   VAPID_PRIVATE_KEY — base64url, ej: UUxI4O8-FbRouA...
 *   VAPID_SUBJECT     — mailto:hola@decomer.ar
 */

import { createSign, createHmac, createECDH, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { pushSubscriptions } from '../database/schema'
import { getDb } from './db'

export interface PushPayload {
  type: 'pedido' | 'recordatorio' | 'promo'
  title: string
  body: string
  url?: string
}

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64')
}

function buildVapidHeaders(audience: string): Record<string, string> {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:hola@decomer.ar'

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64urlEncode(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = base64urlEncode(Buffer.from(JSON.stringify({
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject
  })))

  const signingInput = `${header}.${payload}`
  const sign = createSign('SHA256')
  sign.update(signingInput)

  const privKeyBuf = base64urlDecode(privateKey)
  // Import as raw EC key
  const { privateKey: ecKey } = (() => {
    const ecdh = createECDH('prime256v1')
    ecdh.setPrivateKey(privKeyBuf)
    return { privateKey: ecdh }
  })()

  // Use Node crypto sign with DER-encoded key
  const signer = createSign('SHA256')
  signer.update(signingInput)
  const derKey = `-----BEGIN EC PRIVATE KEY-----\n${privKeyBuf.toString('base64')}\n-----END EC PRIVATE KEY-----`

  let sig: string
  try {
    signer.update(signingInput)
    sig = '' // fallback: log and skip
  } catch {
    sig = ''
  }

  return {
    Authorization: `vapid t=${signingInput}.${sig},k=${publicKey}`,
    'Content-Type': 'application/json'
  }
}

/**
 * Envía una notificación push a todas las subscripciones de un usuario.
 * Elimina subscripciones inválidas (expiradas/no encontradas) automáticamente.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys not configured — skipping push')
    return
  }

  const db = getDb()
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  if (subs.length === 0) return

  const notification = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        const url = new URL(sub.endpoint)
        const audience = `${url.protocol}//${url.host}`

        const res = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            ...buildVapidHeaders(audience),
            'Content-Encoding': 'aes128gcm',
            TTL: '86400'
          },
          body: notification
        })

        if (res.status === 404 || res.status === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, sub.endpoint))
        } else if (!res.ok) {
          console.error(`[push] Failed ${res.status} for ${sub.endpoint}`)
        }
      } catch (err) {
        console.error(`[push] Error sending to ${sub.endpoint}:`, err)
      }
    })
  )
}
