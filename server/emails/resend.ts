// Resend email client
// API Key from env: RESEND_API_KEY
// Configured domain: codecave.ar (verified)

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const DEFAULT_FROM = 'DeComer <noreply@codecave.ar>'
const DEFAULT_REPLY_TO = 'ventas@mail.codecave.ar'

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  replyTo = DEFAULT_REPLY_TO
}: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.error('[Resend] RESEND_API_KEY not configured')
    throw new Error('Email service not configured')
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || stripHtml(html), // fallback: strip HTML tags
        reply_to: replyTo
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Resend] API error:', error)
      throw new Error(`Resend API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Resend] Email sent:', data.id)
    return data
  } catch {
    console.error('[Resend] Send failed:', error)
    throw error
  }
}

/**
 * Simple HTML tag stripper for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}
