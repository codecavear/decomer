import { baseTemplate } from './base'

export interface PedidoConfirmadoData {
  nombre: string
  numeroPedido: string
  items: Array<{
    nombre: string
    cantidad: number
  }>
  total: number
  fechaEntrega: string // "Lunes 18/03"
  direccion: string
  pedidoUrl?: string
}

export function pedidoConfirmadoEmail({
  nombre,
  numeroPedido,
  items,
  total,
  fechaEntrega,
  direccion,
  pedidoUrl = 'https://decomer.codecave.ar/mis-pedidos'
}: PedidoConfirmadoData) {
  const itemsList = items
    .map(item => `<li>${item.nombre} x${item.cantidad}</li>`)
    .join('\n')

  const body = `
    <h1>Pedido confirmado - #${numeroPedido}</h1>
    <p>Hola ${nombre},</p>
    <p>Tu pedido está confirmado. Esto es lo que pediste:</p>
    
    <p><strong>Pedido #${numeroPedido}</strong></p>
    <ul>
      ${itemsList}
    </ul>

    <p>
      <strong>Total:</strong> $${total.toLocaleString('es-AR')}<br>
      <strong>Entrega:</strong> ${fechaEntrega}, entre 9 y 14hs<br>
      <strong>Dirección:</strong> ${direccion}
    </p>

    <p>Cocinamos mañana temprano. Te avisamos cuando salga para tu casa.</p>

    <a href="${pedidoUrl}" class="button">Ver mi pedido</a>

    <p>— DeComer</p>
  `

  return {
    subject: `Pedido confirmado - #${numeroPedido}`,
    html: baseTemplate({
      title: 'Pedido confirmado',
      preview: `Tu pedido #${numeroPedido} está confirmado. Entrega: ${fechaEntrega}.`,
      body
    })
  }
}
