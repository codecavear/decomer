import { z } from 'zod'
import { getDb } from '../../../../utils/db'
import { products } from '../../../../database/schema/products'

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isLowCarb: z.boolean().default(false),
  isAvailable: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)

  const db = getDb()

  const body = await readBody(event)
  const validation = createProductSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const [newProduct] = await db
    .insert(products)
    .values(validation.data)
    .returning()

  return newProduct
})
