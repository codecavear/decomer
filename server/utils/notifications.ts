/**
 * Notification Service
 * Handles SMS and WhatsApp notifications via Twilio
 */

interface NotificationConfig {
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioPhoneNumber?: string
  twilioWhatsAppNumber?: string
}

export interface NotificationPayload {
  to: string // Phone number in E.164 format (+5493515551234)
  message: string
  channel: 'sms' | 'whatsapp'
  metadata?: Record<string, unknown>
}

interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Initialize notification config from environment
 */
function getNotificationConfig(): NotificationConfig {
  const config = useRuntimeConfig()

  return {
    twilioAccountSid: config.twilioAccountSid,
    twilioAuthToken: config.twilioAuthToken,
    twilioPhoneNumber: config.twilioPhoneNumber,
    twilioWhatsAppNumber: config.twilioWhatsAppNumber
  }
}

/**
 * Send notification via Twilio
 */
async function sendTwilioNotification(
  payload: NotificationPayload,
  config: NotificationConfig
): Promise<NotificationResult> {
  const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber, twilioWhatsAppNumber } = config

  if (!twilioAccountSid || !twilioAuthToken) {
    return {
      success: false,
      error: 'Twilio credentials not configured'
    }
  }

  const from = payload.channel === 'whatsapp'
    ? twilioWhatsAppNumber
    : twilioPhoneNumber

  if (!from) {
    return {
      success: false,
      error: `Twilio ${payload.channel} number not configured`
    }
  }

  try {
    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`

    // Format phone numbers for WhatsApp
    const formattedTo = payload.channel === 'whatsapp'
      ? `whatsapp:${payload.to}`
      : payload.to
    const formattedFrom = payload.channel === 'whatsapp'
      ? `whatsapp:${from}`
      : from

    const body = new URLSearchParams({
      To: formattedTo,
      From: formattedFrom,
      Body: payload.message
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send notification'
      }
    }

    return {
      success: true,
      messageId: data.sid
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Send notification (main entry point)
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const config = getNotificationConfig()

  // For now, only Twilio is supported
  return await sendTwilioNotification(payload, config)
}

/**
 * Order notification templates
 */
export const OrderNotificationTemplates = {
  orderConfirmed: (orderNumber: string, deliveryDay: string, itemCount: number, total: string) => `
✅ Pedido #${orderNumber} confirmado
Entrega: ${deliveryDay} 9-14hs
Viandas: ${itemCount}
Total: $${total}
  `.trim(),

  orderEnRoute: (eta: string, address: string) => `
🚴 Tu pedido está en camino
Llega en aprox ${eta}
Dirección: ${address}
  `.trim(),

  orderDelivered: () => `
📦 Pedido entregado
Guardá las viandas en la heladera. Duran 4-5 días.
¿Todo bien? Respondé este mensaje si hubo algún problema.
  `.trim(),

  reminderSelectMeals: (deadline: string, link: string) => `
📋 ¿Ya elegiste tus viandas?
Tenés hasta ${deadline}.
Elegir: ${link}
  `.trim(),

  newMenuAvailable: (link: string) => `
🍽️ Nuevo menú disponible
Mirá las opciones de esta semana: ${link}
  `.trim(),

  paymentFailed: (link: string) => `
⚠️ No pudimos procesar tu pago
Actualizá tu método de pago para no perder la entrega: ${link}
  `.trim(),

  subscriptionRenewal: (planName: string, amount: string, link: string) => `
📅 Tu plan se renueva mañana
${planName} - $${amount}
¿Cambiar algo? ${link}
  `.trim()
}
