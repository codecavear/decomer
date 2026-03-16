import { _eq, sql, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { stores, storeLocations } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = Number(query.lat)
  const lng = Number(query.lng)
  const radius = Number(query.radius) || 5 // km

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    throw createError({ statusCode: 400, message: 'Valid latitude and longitude are required' })
  }

  const db = getDb()

  // Calculate distance using Haversine formula
  // Distance in km = 6371 * acos(cos(lat1) * cos(lat2) * cos(lng2 - lng1) + sin(lat1) * sin(lat2))
  const distanceFormula = sql<number>`
    (6371 * acos(
      cos(radians(${lat})) * cos(radians(${storeLocations.latitude}::numeric)) *
      cos(radians(${storeLocations.longitude}::numeric) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(${storeLocations.latitude}::numeric))
    ))
  `

  const nearbyStores = await db
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
      ownerId: stores.ownerId,
      location: {
        id: storeLocations.id,
        address: storeLocations.address,
        city: storeLocations.city,
        country: storeLocations.country,
        latitude: storeLocations.latitude,
        longitude: storeLocations.longitude,
        neighborhood: storeLocations.neighborhood,
        apartment: storeLocations.apartment,
        isPrimary: storeLocations.isPrimary
      },
      distance: distanceFormula
    })
    .from(stores)
    .innerJoin(storeLocations, _eq(stores.id, storeLocations.storeId))
    .where(
      and(
        _eq(stores.status, 'active'),
        sql`${distanceFormula} <= ${radius}`
      )
    )
    .orderBy(distanceFormula)

  return { stores: nearbyStores, radius }
})
