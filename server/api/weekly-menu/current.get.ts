import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import type { viandas } from '../../database/schema'
import { weeklyMenus, weeklyMenuViandas } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = getDb()
  const now = new Date()

  // Find active weekly menu for current date
  const activeMenu = await db.query.weeklyMenus.findFirst({
    where: and(
      eq(weeklyMenus.isActive, true),
      lte(weeklyMenus.weekStart, now),
      gte(weeklyMenus.weekEnd, now)
    ),
    with: {
      viandas: {
        with: {
          vianda: true
        },
        where: eq(weeklyMenuViandas.isAvailable, true)
      }
    },
    orderBy: [desc(weeklyMenus.weekStart)]
  })

  if (!activeMenu) {
    return {
      menu: null,
      message: 'No active weekly menu found'
    }
  }

  // Group viandas by day of week (null = all week)
  const viandasByDay: Record<string, typeof viandas.$inferSelect[]> = {
    all: [],
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: [] // Saturday
  }

  for (const menuVianda of activeMenu.viandas) {
    const day = menuVianda.dayOfWeek === null ? 'all' : menuVianda.dayOfWeek.toString()
    viandasByDay[day].push(menuVianda.vianda)
  }

  return {
    menu: {
      id: activeMenu.id,
      weekStart: activeMenu.weekStart,
      weekEnd: activeMenu.weekEnd,
      viandasByDay
    }
  }
})
