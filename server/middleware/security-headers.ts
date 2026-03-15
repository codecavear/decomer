/**
 * Security headers middleware
 * Adds recommended security headers to all responses
 */

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Skip for internal Nuxt routes
  if (path.startsWith('/_nuxt/') || path.startsWith('/__nuxt')) {
    return
  }

  const isDev = process.env.NODE_ENV === 'development'

  // X-Content-Type-Options: Prevent MIME type sniffing
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  // X-Frame-Options: Prevent clickjacking
  setHeader(event, 'X-Frame-Options', 'DENY')

  // X-XSS-Protection: Enable browser's XSS filter
  setHeader(event, 'X-XSS-Protection', '1; mode=block')

  // Referrer-Policy: Control referrer information
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Disable unnecessary features, allow geolocation (needed for store search)
  setHeader(event, 'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  )

  // Strict-Transport-Security: Force HTTPS (only in production)
  if (!isDev) {
    setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Prevent caching of sensitive API responses
  if (path.startsWith('/api/')) {
    if (path.includes('/auth/') || path.includes('/subscriptions/')) {
      setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, private')
      setHeader(event, 'Pragma', 'no-cache')
    }
  }
})
