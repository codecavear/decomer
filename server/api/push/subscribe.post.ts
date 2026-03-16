import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { pushSubscriptions } from '../../database/schema'
import { getDb } from '../../utils/db'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, subscribeSchema.parse)

  const db = getDb()

  // Upsert: if endpoint already exists update user association
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, body.endpoint))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({ userId: user.id, p256dh: body.p256dh, auth: body.auth })
      .where(eq(pushSubscriptions.endpoint, body.endpoint))
  } else {
    await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth
    })
  }

  return { ok: true }
})
