import type { CartItem, StoreContact, DeliveryType } from '~/types'

/**
 * WhatsApp Checkout Composable
 *
 * Generates wa.me links for finalizing orders via WhatsApp.
 *
 * ⚠️ IMPORTANT: WhatsApp checkout is ONLY available when the store
 * has a WhatsApp contact configured in the database.
 * No fallback - if no store WhatsApp, the feature is disabled.
 *
 * To enable WhatsApp for a store:
 * - Add a contact with type 'whatsapp' in the store's panel
 *
 * To customize message template:
 * - Modify buildMessage() function below
 */

interface WhatsAppCheckoutOptions {
  storeName: string
  storeSlug?: string
  items: CartItem[]
  total: number
  deliveryType?: DeliveryType
  deliveryAddress?: {
    address: string
    city: string
    apartment?: string
    notes?: string
  }
  notes?: string
}

export function useWhatsAppCheckout() {
  /**
   * Sanitize phone number: remove all non-digits, ensure country code
   * Assumes Argentina (+54) if no country code present
   */
  const sanitizePhone = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '')

    // If starts with 0, remove it (local Argentine format)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }

    // If doesn't start with country code, add Argentina's +54
    if (!cleaned.startsWith('54')) {
      cleaned = '54' + cleaned
    }

    return cleaned
  }

  /**
   * Get WhatsApp number for a store
   * Returns null if store has no WhatsApp contact configured
   *
   * ⚠️ NO FALLBACK: Store must have WhatsApp contact to enable this feature
   */
  const getWhatsAppNumber = (contacts?: StoreContact[]): string | null => {
    if (!contacts || contacts.length === 0) {
      return null
    }

    const whatsappContact = contacts.find(c => c.type === 'whatsapp')
    if (whatsappContact?.value) {
      return sanitizePhone(whatsappContact.value)
    }

    return null
  }

  /**
   * Format currency for message
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price)
  }

  /**
   * Build WhatsApp message for order
   *
   * 📝 CUSTOMIZE MESSAGE TEMPLATE HERE
   * Modify this function to change the order message format
   */
  const buildMessage = (options: WhatsAppCheckoutOptions): string => {
    const { storeName, items, total, deliveryType, deliveryAddress, notes } = options

    const lines: string[] = []

    // Header
    lines.push(`🛒 *Nuevo Pedido - ${storeName}*`)
    lines.push('')

    // Items
    lines.push('*Productos:*')
    items.forEach((item) => {
      const itemTotal = Number(item.product.price) * item.quantity
      lines.push(`• ${item.product.name} x${item.quantity} - ${formatPrice(itemTotal)}`)
    })
    lines.push('')

    // Total
    lines.push(`*Total: ${formatPrice(total)}*`)
    lines.push('')

    // Delivery info
    if (deliveryType === 'delivery' && deliveryAddress) {
      lines.push('*Entrega a domicilio:*')
      lines.push(`📍 ${deliveryAddress.address}, ${deliveryAddress.city}`)
      if (deliveryAddress.apartment) {
        lines.push(`🏢 ${deliveryAddress.apartment}`)
      }
      if (deliveryAddress.notes) {
        lines.push(`📝 ${deliveryAddress.notes}`)
      }
    } else {
      lines.push('*Retiro en tienda* 🏪')
    }

    // Notes
    if (notes) {
      lines.push('')
      lines.push(`*Notas:* ${notes}`)
    }

    // Footer
    lines.push('')
    lines.push('---')
    lines.push('_Pedido desde Vegy_')

    return lines.join('\n')
  }

  /**
   * Generate WhatsApp URL for checkout
   * Returns null if no WhatsApp number is available
   */
  const generateWhatsAppUrl = (
    options: WhatsAppCheckoutOptions,
    contacts?: StoreContact[]
  ): string | null => {
    const phone = getWhatsAppNumber(contacts)
    if (!phone) return null

    const message = buildMessage(options)
    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${phone}?text=${encodedMessage}`
  }

  /**
   * Open WhatsApp with pre-filled order message
   * Returns true if successful, false if no number available
   */
  const openWhatsAppCheckout = (
    options: WhatsAppCheckoutOptions,
    contacts?: StoreContact[]
  ): boolean => {
    const url = generateWhatsAppUrl(options, contacts)
    if (!url) return false

    // Open in new window (works on mobile and desktop)
    window.open(url, '_blank')
    return true
  }

  /**
   * Check if WhatsApp checkout is available for a store
   */
  const isWhatsAppAvailable = (contacts?: StoreContact[]): boolean => {
    return getWhatsAppNumber(contacts) !== null
  }

  return {
    sanitizePhone,
    getWhatsAppNumber,
    buildMessage,
    generateWhatsAppUrl,
    openWhatsAppCheckout,
    isWhatsAppAvailable
  }
}
