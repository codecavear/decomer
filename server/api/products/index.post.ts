import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products, stores } from '../../database/schema'

const createProductSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be a positive number'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  imagePublicId: z.string().optional(),
  category: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, createProductSchema.parse)

  const db = getDb()

  // Verify user owns the store
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, body.storeId)
  })

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the store owner can create products' })
  }

  const [product] = await db
    .insert(products)
    .values({
      storeId: body.storeId,
      name: body.name,
      description: body.description,
      price: body.price.toFixed(2),
      imageUrl: body.imageUrl,
      imagePublicId: body.imagePublicId,
      category: body.category,
      isAvailable: true
    })
    .returning()

  return product
})
