import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { getDb } from '../../utils/db'
import { magicLinkTokens, users } from '../../database/schema'

const bodySchema = z.object({
  email: z.string().email('Email inválido')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0].message
    })
  }

  const { email } = result.data
  const normalizedEmail = email.toLowerCase().trim()
  const db = getDb()
  const config = useRuntimeConfig()

  // Rate limiting: max 3 tokens per email in last 15 minutes
  const recentTokens = await db.query.magicLinkTokens.findMany({
    where: and(
      eq(magicLinkTokens.email, normalizedEmail),
      gt(magicLinkTokens.createdAt, new Date(Date.now() - 15 * 60 * 1000))
    )
  })

  if (recentTokens.length >= 3) {
    throw createError({
      statusCode: 429,
      message: 'Demasiados intentos. Esperá unos minutos.'
    })
  }

  // Generate secure token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Store token
  await db.insert(magicLinkTokens).values({
    email: normalizedEmail,
    token,
    expiresAt
  })

  // Build magic link URL
  const baseUrl = config.public.siteUrl || 'https://vegy.ar'
  const magicLinkUrl = `${baseUrl}/api/auth/verify?token=${token}`

  // Check if user exists (for email personalization)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail)
  })

  // Send email via Resend
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    throw createError({
      statusCode: 500,
      message: 'Error al enviar el email. Intentá más tarde.'
    })
  }

  await $fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      from: 'Vegy <vegy@codecave.ar>',
      to: normalizedEmail,
      subject: 'Tu link de acceso a Vegy 🌱',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #22c55e; font-size: 28px; margin: 0;">🌱 Vegy</h1>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      ${existingUser?.name ? `¡Hola ${existingUser.name}!` : '¡Hola!'}
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
      Hacé click en el botón para acceder a tu cuenta de Vegy:
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${magicLinkUrl}" style="display: inline-block; background: #22c55e; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
        Acceder a Vegy
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      Este link expira en 15 minutos y solo puede usarse una vez.
    </p>
    
    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
      Si no solicitaste este email, podés ignorarlo.<br>
      <a href="${baseUrl}" style="color: #22c55e;">vegy.ar</a>
    </p>
  </div>
</body>
</html>
      `.trim()
    }
  }).catch((error) => {
    console.error('Resend error:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al enviar el email. Intentá más tarde.'
    })
  })

  return {
    success: true,
    message: 'Te enviamos un link a tu email'
  }
})
