import { inicioDeHoy } from './fechas';

export type MotivoCierre = 'cancelado' | 'finalizado' | 'agotado' | 'pasado';

/**
 * ¿Por qué no se pueden vender/reservar boletos de este evento? null = venta abierta.
 * Misma regla para la página del evento y para la API (que es la que manda).
 * Un evento sigue a la venta todo el día en que ocurre (hora local).
 */
export function motivoVentaCerrada(ev: { fecha: Date | string; status?: string }): MotivoCierre | null {
  if (ev.status === 'cancelado') return 'cancelado';
  if (ev.status === 'finalizado') return 'finalizado';
  if (ev.status === 'agotado') return 'agotado';
  if (new Date(ev.fecha) < inicioDeHoy()) return 'pasado';
  return null;
}

export const MENSAJE_CIERRE: Record<MotivoCierre, string> = {
  cancelado: 'Este evento fue cancelado.',
  finalizado: 'Este evento ya finalizó.',
  agotado: 'Los boletos de este evento están agotados.',
  pasado: 'Este evento ya pasó; la venta de boletos está cerrada.',
};
