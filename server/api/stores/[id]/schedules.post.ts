import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { stores, storeSchedules } from '../../../database/schema'

const createScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional().nullable(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional().nullable(),
  isClosed: z.boolean().default(false)
})

const bulkScheduleSchema = z.array(createScheduleSchema)

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

  const body = await readValidatedBody(event, bulkScheduleSchema.parse)

  const db = getDb()

  // Check if store exists and user is the owner
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, id)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the store owner can add schedules' })
  }

  // Delete existing schedules for the store
  await db
    .delete(storeSchedules)
    .where(eq(storeSchedules.storeId, id))

  // Insert new schedules
  const schedules = await db
    .insert(storeSchedules)
    .values(
      body.map(schedule => ({
        ...schedule,
        storeId: id
      }))
    )
    .returning()

  return { schedules }
})
