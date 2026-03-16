import { eq } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { categories, storeCategories, stores, storeLocations } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const categoryId = getRouterParam(event, 'categoryId')

  if (!categoryId) {
    throw createError({ statusCode: 400, message: 'Category ID is required' })
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  const db = getDb()

  // Verify category exists
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))

  if (!category) {
    throw createError({ statusCode: 404, message: 'Category not found' })
  }

  // Get stores with this category and their primary locations
  const storesInCategory = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      description: stores.description,
      logoUrl: stores.logoUrl,
      bannerUrl: stores.bannerUrl,
      status: stores.status,
      createdAt: stores.createdAt,
      updatedAt: stores.updatedAt,
      primaryLocation: {
        id: storeLocations.id,
        address: storeLocations.address,
        city: storeLocations.city,
        country: storeLocations.country,
        latitude: storeLocations.latitude,
        longitude: storeLocations.longitude,
        neighborhood: storeLocations.neighborhood,
        apartment: storeLocations.apartment
      }
    })
    .from(stores)
    .innerJoin(storeCategories, eq(stores.id, storeCategories.storeId))
    .leftJoin(
      storeLocations,
      eq(stores.id, storeLocations.storeId)
    )
    .where(eq(storeCategories.categoryId, categoryId))
    .orderBy(stores.name)
    .limit(limit)
    .offset(offset)

  // Group stores with their primary location
  const storeMap = new Map()

  for (const row of storesInCategory) {
    if (!storeMap.has(row.id)) {
      storeMap.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        logoUrl: row.logoUrl,
        bannerUrl: row.bannerUrl,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        primaryLocation: null
      })
    }

    // Set primary location (first location found)
    if (row.primaryLocation?.id && !storeMap.get(row.id)?.primaryLocation) {
      storeMap.get(row.id)!.primaryLocation = row.primaryLocation
    }
  }

  const storesList = Array.from(storeMap.values())

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon
    },
    stores: storesList,
    pagination: {
      limit,
      offset,
      total: storesList.length
    }
  }
})
