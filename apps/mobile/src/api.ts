import Constants from 'expo-constants';
import type { Evento } from '@xoc/shared';

const BASE = (Constants.expoConfig?.extra as { apiBaseUrl?: string })?.apiBaseUrl
  || 'https://xoc-tickets.com';

// La app móvil consume EXACTAMENTE la misma API que la web.
// Para endpoints de staff se envía el token de sesión (pendiente: login móvil).
export async function getEventos(): Promise<Evento[]> {
  const res = await fetch(`${BASE}/api/events`);
  return res.json();
}

export async function scanTicket(qrToken: string, authCookie?: string) {
  const res = await fetch(`${BASE}/api/tickets/${qrToken}/scan`, {
    method: 'POST',
    headers: authCookie ? { cookie: authCookie } : {},
  });
  return res.json() as Promise<{ ok: boolean; motivo?: string }>;
}
