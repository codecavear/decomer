import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../../../utils/db'
import { products } from '../../../../database/schema/products'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isLowCarb: z.boolean().optional(),
  isAvailable: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)

  const db = getDb()

  const productId = getRouterParam(event, 'id')
  if (!productId) {
    throw createError({
      statusCode: 400,
      message: 'Product ID is required'
    })
  }

  const body = await readBody(event)
  const validation = updateProductSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.issues[0].message
    })
  }

  const [updatedProduct] = await db
    .update(products)
    .set({
      ...validation.data,
      updatedAt: new Date()
    })
    .where(eq(products.id, productId))
    .returning()

  if (!updatedProduct) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }

  return updatedProduct
})
