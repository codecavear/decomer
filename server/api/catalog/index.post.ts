import { _eq, count } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

const FREE_TIER_PRODUCT_LIMIT = 100

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url().optional().nullable(),
  category: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  // Validate request body
  const body = await readBody(event)
  const parsed = createProductSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed._error.errors[0].message
    })
  }

  // Check product limit for free tier
  const [{ productCount }] = await db
    .select({ productCount: count() })
    .from(products)
    .where(_eq(products.ownerId, user.id))

  if (productCount >= FREE_TIER_PRODUCT_LIMIT) {
    throw createError({
      statusCode: 403,
      message: `Has alcanzado el limite de ${FREE_TIER_PRODUCT_LIMIT} productos del plan gratuito`
    })
  }

  // Create the product
  const [newProduct] = await db.insert(products).values({
    ownerId: user.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: parsed.data.price.toString(),
    imageUrl: parsed.data.imageUrl || null,
    category: parsed.data.category || null
  }).returning()

  return newProduct
})
