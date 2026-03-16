export default defineEventHandler(() => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY

  if (!vapidPublicKey) {
    throw createError({
      statusCode: 500,
      message: 'VAPID public key not configured'
    })
  }

  return {
    publicKey: vapidPublicKey
  }
})
