import { baseTemplate } from './base'

export interface MenuNuevoData {
  nombre: string
  viandasDestacadas?: Array<{
    nombre: string
  }>
  menuUrl?: string
}

export function menuNuevoEmail({
  nombre,
  viandasDestacadas = [],
  menuUrl = 'https://decomer.codecave.ar/menu'
}: MenuNuevoData) {
  const destacadasList = viandasDestacadas.length > 0
    ? `
      <p>Algunas opciones:</p>
      <ul>
        ${viandasDestacadas.map(v => `<li>${v.nombre}</li>`).join('\n')}
      </ul>
      <p>Y hay más. Entrá a la app para ver todo y elegir.</p>
    `
    : '<p>Entrá a la app para ver todas las opciones.</p>'

  const body = `
    <h1>Nuevo menú disponible 📋</h1>
    <p>Hola ${nombre},</p>
    <p>Ya está el menú de esta semana.</p>
    
    ${destacadasList}

    <a href="${menuUrl}" class="button">Ver menú</a>

    <p>— DeComer</p>
  `

  return {
    subject: 'Nuevo menú disponible 📋',
    html: baseTemplate({
      title: 'Nuevo menú disponible',
      preview: 'Ya está el menú de esta semana. Entrá para ver las opciones.',
      body
    })
  }
}
