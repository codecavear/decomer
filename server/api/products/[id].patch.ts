import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be a positive number').optional(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  category: z.string().optional(),
  isAvailable: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }

  const body = await readValidatedBody(event, updateProductSchema.parse)

  const db = getDb()

  // Get the product with store info
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      store: true
    }
  })

  if (!product) {
    throw createError({ statusCode: 404, message: '_Product not found' })
  }

  // Check if user owns the store
  if (product.store.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the store owner can update this product' })
  }

  // Prepare update data
  const updateData = {
    ...body,
    updatedAt: new Date()
  }

  // Convert price to string with 2 decimal places if provided
  if (body.price !== undefined) {
    updateData.price = body.price.toFixed(2)
  }

  const [updated] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id))
    .returning()

  return updated
})
