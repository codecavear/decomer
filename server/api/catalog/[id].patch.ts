import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Product ID is required'
    })
  }

  // Validate request body
  const body = await readBody(event)
  const parsed = updateProductSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0].message
    })
  }

  // Check product exists and belongs to user
  const existingProduct = await db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      eq(products.ownerId, user.id)
    )
  })

  if (!existingProduct) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }

  // Build update object
  const updateData: Record<string, any> = {
    updatedAt: new Date()
  }

  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.price !== undefined) updateData.price = parsed.data.price.toString()
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category

  // Update the product
  const [updatedProduct] = await db.update(products)
    .set(updateData)
    .where(eq(products.id, id))
    .returning()

  return updatedProduct
})
