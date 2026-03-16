import { _eq, and, gt } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { magicLinkTokens, users } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    return sendRedirect(event, '/login?error=missing_token')
  }

  const db = getDb()

  // Find valid token
  const tokenRecord = await db.query.magicLinkTokens.findFirst({
    where: and(
      _eq(magicLinkTokens.token, token),
      _eq(magicLinkTokens.used, false),
      gt(magicLinkTokens.expiresAt, new Date())
    )
  })

  if (!tokenRecord) {
    return sendRedirect(event, '/login?error=invalid_token')
  }

  // Mark token as used
  await db.update(magicLinkTokens)
    .set({ used: true })
    .where(_eq(magicLinkTokens.id, tokenRecord.id))

  // Find or create user
  let dbUser = await db.query.users.findFirst({
    where: _eq(users.email, tokenRecord.email)
  })

  if (!dbUser) {
    // Create new user with magic link (no googleId)
    const [newUser] = await db.insert(users).values({
      email: tokenRecord.email,
      name: null,
      googleId: null
    }).returning()
    dbUser = newUser

    // Notify new registration
    const { notifyNewUser } = await import('../../utils/notify-registration')
    notifyNewUser({ email: tokenRecord.email, provider: 'magic-link' }).catch(() => {})
  } else {
    // Update last login
    const [updatedUser] = await db.update(users)
      .set({ updatedAt: new Date() })
      .where(_eq(users.id, dbUser.id))
      .returning()
    dbUser = updatedUser
  }

  if (!dbUser) {
    return sendRedirect(event, '/login?error=user_creation_failed')
  }

  // Create session
  await setUserSession(event, {
    user: {
      id: dbUser.id,
      googleId: dbUser.googleId,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl
    }
  })

  // Check for redirect cookie
  const redirectUrl = getCookie(event, 'auth_redirect')
  deleteCookie(event, 'auth_redirect', { path: '/' })

  // Validate redirect URL (security)
  if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
    return sendRedirect(event, redirectUrl)
  }

  return sendRedirect(event, '/')
})
