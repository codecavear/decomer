import { z } from 'zod'
import { _eq } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { stores, storeLocations } from '../../../database/schema'

const createLocationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  neighborhood: z.string().optional(),
  apartment: z.string().optional(),
  isPrimary: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

  const body = await readValidatedBody(event, createLocationSchema.parse)

  const db = getDb()

  // Check if store exists and user is the owner
  const store = await db.query.stores.findFirst({
    where: _eq(stores.id, id)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the store owner can add locations' })
  }

  // If this is set as primary, unset all other primary locations
  if (body.isPrimary) {
    await db
      .update(storeLocations)
      .set({ isPrimary: false })
      .where(_eq(storeLocations.storeId, id))
  }

  const [location] = await db
    .insert(storeLocations)
    .values({
      ...body,
      storeId: id,
      latitude: body.latitude.toString(),
      longitude: body.longitude.toString()
    })
    .returning()

  return location
})
