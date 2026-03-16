import { z } from 'zod'
import { and, _eq } from 'drizzle-orm'
import { pushSubscriptions } from '../../database/schema'
import { getDb } from '../../utils/db'

const unsubscribeSchema = z.object({
  endpoint: z.string().url()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, unsubscribeSchema.parse)

  const db = getDb()

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        _eq(pushSubscriptions.userId, user.id),
        _eq(pushSubscriptions.endpoint, body.endpoint)
      )
    )

  return { ok: true }
})
