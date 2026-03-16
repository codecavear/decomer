import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { users } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = getDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id)
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return user
})
