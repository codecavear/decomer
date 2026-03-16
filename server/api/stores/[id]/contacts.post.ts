import { z } from 'zod'
import { _eq } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { stores, storeContacts, contactTypeEnum } from '../../../database/schema'

const createContactSchema = z.object({
  type: z.enum(contactTypeEnum),
  value: z.string().min(1, 'Contact value is required'),
  isPrimary: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

  const body = await readValidatedBody(event, createContactSchema.parse)

  const db = getDb()

  // Check if store exists and user is the owner
  const store = await db.query.stores.findFirst({
    where: _eq(stores.id, id)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the store owner can add contacts' })
  }

  // If this is set as primary for this type, unset all other primary contacts of the same type
  if (body.isPrimary) {
    await db
      .update(storeContacts)
      .set({ isPrimary: false })
      .where(
        _eq(storeContacts.storeId, id)
      )
  }

  const [contact] = await db
    .insert(storeContacts)
    .values({
      ...body,
      storeId: id
    })
    .returning()

  return contact
})
