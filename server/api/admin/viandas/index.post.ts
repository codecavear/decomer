import { getDb } from '../../../utils/db'
import { viandas } from '../../../database/schema'
import { slugify } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)
  const db = getDb()
  const body = await readBody(event)

  // Validate required fields
  if (!body.name || !body.price) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and price are required'
    })
  }

  // Generate slug from name
  const slug = body.slug || slugify(body.name)

  // Insert vianda
  const [newVianda] = await db.insert(viandas).values({
    name: body.name,
    slug,
    description: body.description || null,
    imageUrl: body.imageUrl || null,
    imagePublicId: body.imagePublicId || null,
    calories: body.calories || null,
    protein: body.protein?.toString() || null,
    carbs: body.carbs?.toString() || null,
    fats: body.fats?.toString() || null,
    isVegetarian: body.isVegetarian || false,
    isVegan: body.isVegan || false,
    isGlutenFree: body.isGlutenFree || false,
    isLowCarb: body.isLowCarb || false,
    isHighProtein: body.isHighProtein || false,
    ingredients: body.ingredients || [],
    isAvailable: body.isAvailable ?? true,
    price: body.price.toString()
  }).returning()

  return newVianda
})
