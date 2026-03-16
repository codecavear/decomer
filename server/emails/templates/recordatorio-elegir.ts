import { baseTemplate } from './base'

export interface RecordatorioElegirData {
  nombre: string
  deadline?: string // "mañana a las 18hs"
  menuUrl?: string
}

export function recordatorioElegirEmail({
  nombre,
  deadline = 'mañana a las 18hs',
  menuUrl = 'https://decomer.codecave.ar/menu'
}: RecordatorioElegirData) {
  const body = `
    <h1>¿Ya elegiste tus viandas de la semana?</h1>
    <p>Hola ${nombre},</p>
    <p>El menú de esta semana está listo y todavía no elegiste tus viandas.</p>
    
    <p>Tenés hasta <strong>${deadline}</strong> para armar tu pedido. Si no elegís, te mandamos las más populares (que están muy buenas, pero capaz preferís elegir vos).</p>

    <a href="${menuUrl}" class="button">Elegir mis viandas</a>

    <p>— DeComer</p>
  `

  return {
    subject: '¿Ya elegiste tus viandas de la semana?',
    html: baseTemplate({
      title: 'Recordatorio: Elegir viandas',
      preview: `El menú de esta semana está listo. Tenés hasta ${deadline} para elegir.`,
      body
    })
  }
}
