import { baseTemplate } from './base'

export interface PedidoEntregadoData {
  nombre: string
  numeroPedido: string
  feedbackUrl?: string
}

export function pedidoEntregadoEmail({
  nombre,
  numeroPedido,
  feedbackUrl = 'https://decomer.codecave.ar/feedback'
}: PedidoEntregadoData) {
  const body = `
    <h1>Entregamos tu pedido ✓</h1>
    <p>Hola ${nombre},</p>
    <p>Tu pedido #${numeroPedido} fue entregado.</p>
    
    <p>Esperamos que lo disfrutes. Si algo no está bien, escribinos y lo resolvemos.</p>

    <p><strong>¿Cómo estuvo todo?</strong></p>
    <p>
      <a href="${feedbackUrl}?rating=good&order=${numeroPedido}" class="button" style="background: #10b981; margin-right: 12px;">👍 Todo bien</a>
      <a href="${feedbackUrl}?rating=issue&order=${numeroPedido}" class="button" style="background: #ef4444;">👎 Tuve un problema</a>
    </p>

    <p>— DeComer</p>
  `

  return {
    subject: 'Entregamos tu pedido ✓',
    html: baseTemplate({
      title: 'Pedido entregado',
      preview: `Tu pedido #${numeroPedido} fue entregado.`,
      body
    })
  }
}
