import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { pushSubscriptions } from '../../database/schema/pushSubscriptions'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const body = await readBody(event)
  const validation = subscribeSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.issues[0].message
    })
  }

  const { endpoint, keys } = validation.data
  const db = getDb()

  // Check if subscription already exists
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    // Update existing subscription keys
    const [updated] = await db
      .update(pushSubscriptions)
      .set({
        p256dh: keys.p256dh,
        auth: keys.auth
      })
      .where(eq(pushSubscriptions.id, existing[0].id))
      .returning()

    return { success: true, subscription: updated }
  }

  // Create new subscription
  const [newSubscription] = await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    })
    .returning()

  return { success: true, subscription: newSubscription }
})
