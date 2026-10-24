// Zona horaria del negocio: las fechas de evento se capturan en hora local.
export const APP_TZ = process.env.APP_TIMEZONE || 'America/Mexico_City';

/**
 * Inicio del día de hoy en la zona del negocio, con la misma convención con la que
 * se guarda `evento.fecha` (medianoche UTC del día capturado, p.ej. 2026-10-24T00:00Z).
 *
 * Un evento es "de hoy o futuro" si `fecha >= inicioDeHoy()`: así sigue visible
 * todo el día del evento (hora local) y desaparece al día siguiente. Comparar contra
 * `new Date()` lo ocultaba desde las 6 p.m. del día anterior (UTC-6).
 */
/** Formatea `evento.fecha` mostrando el día capturado, sin desfase por zona horaria. */
export function fechaEvento(fecha: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'long' }) {
  return new Date(fecha).toLocaleDateString('es-MX', { ...opts, timeZone: 'UTC' });
}

export function inicioDeHoy(): Date {
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()); // 'YYYY-MM-DD'
  return new Date(`${hoy}T00:00:00Z`);
}
