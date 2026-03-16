import { _eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { users } from '../../database/schema'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const db = getDb()

    // Find or create user in database
    let dbUser = await db.query.users.findFirst({
      where: _eq(users.googleId, user.sub)
    })

    if (!dbUser) {
      const [newUser] = await db.insert(users).values({
        googleId: user.sub,
        email: user.email,
        name: user.name,
        avatarUrl: user.picture
      }).returning()
      dbUser = newUser

      // Notify new registration
      const { notifyNewUser } = await import('../../utils/notify-registration')
      notifyNewUser({ email: user.email, name: user.name, provider: 'google' }).catch(() => {})
    } else {
      // Update user info on each login
      const [updatedUser] = await db.update(users)
        .set({
          email: user.email,
          name: user.name,
          avatarUrl: user.picture,
          updatedAt: new Date()
        })
        .where(_eq(users.id, dbUser.id))
        .returning()
      dbUser = updatedUser
    }

    if (!dbUser) {
      throw createError({ statusCode: 500, message: 'Failed to create user session' })
    }

    await setUserSession(event, {
      user: {
        id: dbUser.id,
        googleId: dbUser.googleId,
        email: dbUser.email,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl ?? null
      }
    })

    // Check for redirect cookie (set by login page)
    const redirectUrl = getCookie(event, 'auth_redirect')

    // Clear the cookie
    deleteCookie(event, 'auth_redirect', { path: '/' })

    // Validate redirect URL (security: only allow relative paths starting with /)
    if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return sendRedirect(event, redirectUrl)
    }

    return sendRedirect(event, '/')
  },
  onError(event, _error) {
    console._error('Google OAuth _error:', _error)
    // Also clear redirect cookie on _error
    deleteCookie(event, 'auth_redirect', { path: '/' })
    return sendRedirect(event, '/login?_error=auth_failed')
  }
})
