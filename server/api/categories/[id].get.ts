import { _eq, sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { categories, storeCategories } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }

  const db = getDb()

  // Get category with store count
  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      parentId: categories.parentId,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      storeCount: sql<number>`count(distinct ${storeCategories.storeId})::int`
    })
    .from(categories)
    .leftJoin(storeCategories, _eq(categories.id, storeCategories.categoryId))
    .where(_eq(categories.id, id))
    .groupBy(categories.id)

  if (!category) {
    throw createError({ statusCode: 404, message: 'Category not found' })
  }

  // Get parent category if exists
  let parent = null
  if (category.parentId) {
    const [parentCategory] = await db
      .select()
      .from(categories)
      .where(_eq(categories.id, category.parentId))
    parent = parentCategory || null
  }

  // Get child categories
  const children = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      parentId: categories.parentId,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      storeCount: sql<number>`count(distinct ${storeCategories.storeId})::int`
    })
    .from(categories)
    .leftJoin(storeCategories, _eq(categories.id, storeCategories.categoryId))
    .where(_eq(categories.parentId, id))
    .groupBy(categories.id)
    .orderBy(categories.name)

  return {
    ...category,
    parent,
    children
  }
})
