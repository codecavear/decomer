import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from './db'
import { users } from '../database/schema/users'

export async function requireAdminRole(event: H3Event) {
  const { user } = await requireUserSession(event)

  const db = getDb()
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)

  if (!dbUser || dbUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acceso denegado: se requiere rol de administrador'
    })
  }

  return { user: dbUser }
}
