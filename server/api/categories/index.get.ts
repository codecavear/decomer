import { eq, sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { categories, storeCategories } from '../../database/schema'

export default defineEventHandler(async () => {
  try {
    const db = getDb()

    // Get all categories with store counts
    const allCategories = await db
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
      .leftJoin(storeCategories, eq(categories.id, storeCategories.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.name)

    // Organize into hierarchy (parent with children)
    const parentCategories = allCategories.filter(cat => !cat.parentId)
    const childCategories = allCategories.filter(cat => cat.parentId)

    const hierarchicalCategories = parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parentId === parent.id)
    }))

    return hierarchicalCategories
  } catch (error) {
    console.warn('Categories API: Database connection failed during build, returning empty array:', error.message)
    // Return empty array during build when database is not available
    return []
  }
})
