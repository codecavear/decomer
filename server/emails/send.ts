// High-level email sending utilities for DeComer

import { sendEmail } from './resend'
import {
  bienvenidaEmail,
  pedidoConfirmadoEmail,
  pedidoEnCaminoEmail,
  pedidoEntregadoEmail,
  recordatorioElegirEmail,
  menuNuevoEmail,
  type BienvenidaData,
  type PedidoConfirmadoData,
  type PedidoEnCaminoData,
  type PedidoEntregadoData,
  type RecordatorioElegirData,
  type MenuNuevoData
} from './templates'

/**
 * Send welcome email after user registration
 */
export async function sendBienvenida(to: string, data: BienvenidaData) {
  const { subject, html } = bienvenidaEmail(data)
  return sendEmail({ to, subject, html })
}

/**
 * Send order confirmation email
 */
export async function sendPedidoConfirmado(to: string, data: PedidoConfirmadoData) {
  const { subject, html } = pedidoConfirmadoEmail(data)
  return sendEmail({ to, subject, html })
}

/**
 * Send order out for delivery email
 */
export async function sendPedidoEnCamino(to: string, data: PedidoEnCaminoData) {
  const { subject, html } = pedidoEnCaminoEmail(data)
  return sendEmail({ to, subject, html })
}

/**
 * Send order delivered email
 */
export async function sendPedidoEntregado(to: string, data: PedidoEntregadoData) {
  const { subject, html } = pedidoEntregadoEmail(data)
  return sendEmail({ to, subject, html })
}

/**
 * Send reminder to choose meals email
 */
export async function sendRecordatorioElegir(to: string, data: RecordatorioElegirData) {
  const { subject, html } = recordatorioElegirEmail(data)
  return sendEmail({ to, subject, html })
}

/**
 * Send new menu available email
 */
export async function sendMenuNuevo(to: string, data: MenuNuevoData) {
  const { subject, html } = menuNuevoEmail(data)
  return sendEmail({ to, subject, html })
}
