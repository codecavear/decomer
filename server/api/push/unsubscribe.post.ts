import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { pushSubscriptions } from '../../database/schema/pushSubscriptions'

const unsubscribeSchema = z.object({
  endpoint: z.string().url()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const body = await readBody(event)
  const validation = unsubscribeSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const { endpoint } = validation.data
  const db = getDb()

  const deleted = await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    )
    .returning()

  return {
    success: true,
    deleted: deleted.length > 0
  }
})
