import { eq, and, desc, sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { stores, storeLocations } from '../../database/schema'
import type { StoreType } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  try {
    const city = query.city as string | undefined
    const tipo = query.tipo as string | undefined
    const lat = Number(query.lat)
    const lng = Number(query.lng)
    const radius = Number(query.radio) || 10

    const db = getDb()

    // If lat/lng provided, use nearby search with Haversine
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const distanceFormula = sql<number>`
      (6371 * acos(
        cos(radians(${lat})) * cos(radians(${storeLocations.latitude}::numeric)) *
        cos(radians(${storeLocations.longitude}::numeric) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(${storeLocations.latitude}::numeric))
      ))
    `

      const typeConditions = []
      if (tipo && ['catalog', 'pickup', 'delivery', 'pickup_delivery'].includes(tipo)) {
        typeConditions.push(eq(stores.type, tipo as StoreType))
      }

      const nearbyStores = await db
        .select({
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          description: stores.description,
          logoUrl: stores.logoUrl,
          bannerUrl: stores.bannerUrl,
          status: stores.status,
          type: stores.type,
          ownerId: stores.ownerId,
          createdAt: stores.createdAt,
          updatedAt: stores.updatedAt,
          distance: distanceFormula
        })
        .from(stores)
        .innerJoin(storeLocations, eq(stores.id, storeLocations.storeId))
        .where(
          and(
            eq(stores.status, 'active'),
            sql`${distanceFormula} <= ${radius}`,
            ...typeConditions
          )
        )
        .orderBy(distanceFormula)
        .limit(limit)
        .offset(offset)

      return { stores: nearbyStores, limit, offset, radius }
    }

    // Standard search (no geolocation)
    const whereConditions = [eq(stores.status, 'active')]

    if (tipo && ['catalog', 'pickup', 'delivery', 'pickup_delivery'].includes(tipo)) {
      whereConditions.push(eq(stores.type, tipo as StoreType))
    }

    if (city) {
      const storesInCity = await db
        .select({ storeId: storeLocations.storeId })
        .from(storeLocations)
        .where(eq(storeLocations.city, city))

      const storeIds = storesInCity.map(s => s.storeId)

      if (storeIds.length === 0) {
        return { stores: [], total: 0, limit, offset }
      }

      whereConditions.push(sql`${stores.id} = ANY(${storeIds})`)
    }

    const storeList = await db.query.stores.findMany({
      where: and(...whereConditions),
      with: {
        locations: {
          where: eq(storeLocations.isPrimary, true),
          limit: 1
        }
      },
      orderBy: [desc(stores.createdAt)],
      limit,
      offset
    })

    return { stores: storeList, limit, offset }
  } catch (error) {
    console.warn('Stores API: Database connection failed during build, returning empty result:', error.message)
    // Return empty result during build when database is not available
    return { stores: [], limit, offset }
  }
})
