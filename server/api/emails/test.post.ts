// Test endpoint for transactional emails
// POST /api/emails/test
// Body: { type: 'bienvenida' | 'pedido-confirmado' | ..., to: 'email@example.com' }

import {
  sendBienvenida,
  sendPedidoConfirmado,
  sendPedidoEnCamino,
  sendPedidoEntregado,
  sendRecordatorioElegir,
  sendMenuNuevo
} from '../../emails/send'

export default defineEventHandler(async (event) => {
  const { type, to } = await readBody(event)

  if (!to || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: to, type'
    })
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email format'
    })
  }

  try {
    switch (type) {
      case 'bienvenida':
        await sendBienvenida(to, {
          nombre: 'Usuario de Prueba',
          menuUrl: 'https://decomer.codecave.ar/menu'
        })
        break

      case 'pedido-confirmado':
        await sendPedidoConfirmado(to, {
          nombre: 'Usuario de Prueba',
          numeroPedido: 'TEST-001',
          items: [
            { nombre: 'Pollo al horno con papas', cantidad: 2 },
            { nombre: 'Milanesas de carne', cantidad: 3 },
            { nombre: 'Ensalada completa', cantidad: 1 }
          ],
          total: 8500,
          fechaEntrega: 'Lunes 18/03',
          direccion: 'Av. Colón 1234, Córdoba',
          pedidoUrl: 'https://decomer.codecave.ar/mis-pedidos'
        })
        break

      case 'pedido-en-camino':
        await sendPedidoEnCamino(to, {
          nombre: 'Usuario de Prueba',
          numeroPedido: 'TEST-001',
          direccion: 'Av. Colón 1234, Córdoba',
          horarioEstimado: '12:30 - 13:00'
        })
        break

      case 'pedido-entregado':
        await sendPedidoEntregado(to, {
          nombre: 'Usuario de Prueba',
          numeroPedido: 'TEST-001',
          feedbackUrl: 'https://decomer.codecave.ar/feedback'
        })
        break

      case 'recordatorio-elegir':
        await sendRecordatorioElegir(to, {
          nombre: 'Usuario de Prueba',
          deadline: 'mañana a las 18hs',
          menuUrl: 'https://decomer.codecave.ar/menu'
        })
        break

      case 'menu-nuevo':
        await sendMenuNuevo(to, {
          nombre: 'Usuario de Prueba',
          viandasDestacadas: [
            { nombre: 'Pollo al horno con papas' },
            { nombre: 'Milanesas de carne' },
            { nombre: 'Ensalada completa' }
          ],
          menuUrl: 'https://decomer.codecave.ar/menu'
        })
        break

      default:
        throw createError({
          statusCode: 400,
          message: `Unknown email type: ${type}`
        })
    }

    return {
      success: true,
      message: `Email sent to ${to}`,
      type
    }
  } catch (error) {
    console.error('[Email Test] Error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to send email'
    })
  }
})
