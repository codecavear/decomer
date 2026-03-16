import { baseTemplate } from './base'

export interface BienvenidaData {
  nombre: string
  menuUrl?: string
}

export function bienvenidaEmail({ nombre, menuUrl = 'https://decomer.codecave.ar/menu' }: BienvenidaData) {
  const body = `
    <h1>Bienvenido a DeComer 🍽️</h1>
    <p>Hola ${nombre},</p>
    <p>Gracias por sumarte a DeComer.</p>
    <p>Somos Conrado y Lighuen. Uno se encarga de la app, el otro de la cocina. Juntos hacemos que comer bien sea mas fácil.</p>
    
    <p><strong>Lo que tenés que saber:</strong></p>
    <ul>
      <li>Cocinamos todo fresco, nunca congelamos</li>
      <li>El menú cambia cada semana</li>
      <li>Podés elegir tus viandas o dejarnos sorprenderte</li>
    </ul>

    <p>Tu primer paso: mirá el menú de esta semana y elegí tus viandas.</p>

    <a href="${menuUrl}" class="button">Ver menú</a>

    <p>Cualquier duda, escribinos. Respondemos siempre.</p>
    <p>— El equipo DeComer</p>
  `

  return {
    subject: 'Bienvenido a DeComer 🍽️',
    html: baseTemplate({
      title: 'Bienvenido a DeComer',
      preview: 'Gracias por sumarte a DeComer. Cocinamos todo fresco, nunca congelamos.',
      body
    })
  }
}
