import { _eq, desc } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { favorites, storeLocations } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  const db = getDb()

  const favoriteStores = await db.query.favorites.findMany({
    where: _eq(favorites.userId, user.id),
    with: {
      store: {
        with: {
          locations: {
            where: _eq(storeLocations.isPrimary, true),
            limit: 1
          }
        }
      }
    },
    orderBy: [desc(favorites.createdAt)],
    limit,
    offset
  })

  const stores = favoriteStores.map(fav => ({
    ...fav.store,
    favoritedAt: fav.createdAt
  }))

  return { stores, limit, offset }
})
