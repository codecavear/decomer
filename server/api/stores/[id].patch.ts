import { z } from 'zod'
import { _eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { stores, storeTypeEnum } from '../../database/schema'

const updateStoreSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  logoPublicId: z.string().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  bannerPublicId: z.string().optional().nullable(),
  type: z.enum(storeTypeEnum).optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }

  const body = await readValidatedBody(event, updateStoreSchema.parse)

  const db = getDb()

  // Check if store exists and user is the owner
  const store = await db.query.stores.findFirst({
    where: _eq(stores.id, id)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the store owner can update this store' })
  }

  const [updated] = await db
    .update(stores)
    .set({
      ...body,
      updatedAt: new Date()
    })
    .where(_eq(stores.id, id))
    .returning()

  return updated
})
