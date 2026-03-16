import { _eq } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { viandas } from '../../../database/schema'
import { slugify } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware
  const db = getDb()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vianda ID is required'
    })
  }

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {}

  if (body.name !== undefined) {
    updateData.name = body.name
    updateData.slug = body.slug || slugify(body.name)
  }
  if (body.description !== undefined) updateData.description = body.description
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
  if (body.imagePublicId !== undefined) updateData.imagePublicId = body.imagePublicId
  if (body.calories !== undefined) updateData.calories = body.calories
  if (body.protein !== undefined) updateData.protein = body.protein.toString()
  if (body.carbs !== undefined) updateData.carbs = body.carbs.toString()
  if (body.fats !== undefined) updateData.fats = body.fats.toString()
  if (body.isVegetarian !== undefined) updateData.isVegetarian = body.isVegetarian
  if (body.isVegan !== undefined) updateData.isVegan = body.isVegan
  if (body.isGlutenFree !== undefined) updateData.isGlutenFree = body.isGlutenFree
  if (body.isLowCarb !== undefined) updateData.isLowCarb = body.isLowCarb
  if (body.isHighProtein !== undefined) updateData.isHighProtein = body.isHighProtein
  if (body.ingredients !== undefined) updateData.ingredients = body.ingredients
  if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable
  if (body.price !== undefined) updateData.price = body.price.toString()

  updateData.updatedAt = new Date()

  const [updated] = await db.update(viandas)
    .set(updateData)
    .where(_eq(viandas.id, id))
    .returning()

  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vianda not found'
    })
  }

  return updated
})
