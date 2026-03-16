import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { users } from '../../database/schema'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  deliveryAddress: z.string().max(200).optional().nullable(),
  deliveryNeighborhood: z.string().max(100).optional().nullable(),
  deliveryNotes: z.string().max(300).optional().nullable(),
  allergies: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  deliverySchedule: z.object({ start: z.string(), end: z.string() }).nullable().optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0].message })
  }

  const db = getDb()
  const [updated] = await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))
    .returning()

  return updated
})
