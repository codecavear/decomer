import { baseTemplate } from './base'

export interface PedidoEnCaminoData {
  nombre: string
  numeroPedido: string
  direccion: string
  horarioEstimado?: string // "12:30 - 13:00"
}

export function pedidoEnCaminoEmail({
  nombre,
  numeroPedido,
  direccion,
  horarioEstimado
}: PedidoEnCaminoData) {
  const body = `
    <h1>Tu pedido está en camino 🚴</h1>
    <p>Hola ${nombre},</p>
    <p>Tu pedido #${numeroPedido} está en camino.</p>
    
    <p>
      <strong>Dirección:</strong> ${direccion}<br>
      ${horarioEstimado ? `<strong>Horario estimado:</strong> ${horarioEstimado}<br>` : ''}
    </p>

    <p><strong>Tip:</strong> Cuando llegue, guardá las viandas en la heladera. Duran 4-5 días refrigeradas.</p>

    <p>— DeComer</p>
  `

  return {
    subject: 'Tu pedido está en camino 🚴',
    html: baseTemplate({
      title: 'Pedido en camino',
      preview: `Tu pedido #${numeroPedido} está en camino a ${direccion}.`,
      body
    })
  }
}
