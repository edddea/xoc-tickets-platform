import { getStripe, stripeHabilitado } from './stripe';
import { aprobarReservacionStripe } from './repo';
import { enviarBoletosDeReserva } from './notificar';

/**
 * Confirma un pago con tarjeta consultando Stripe directamente (por la Checkout
 * Session guardada). Se usa al cargar la página de la orden, para que el pago se
 * confirme aunque el webhook no haya llegado (p.ej. `stripe listen` apagado en
 * local, o webhook demorado). Es idempotente y complementa al webhook.
 *
 * Devuelve true si en esta llamada quedó aprobada.
 */
export async function confirmarReservacionStripe(
  reservationId: string,
  sessionId: string | null | undefined,
): Promise<boolean> {
  if (!stripeHabilitado() || !sessionId) return false;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const pi = typeof session.payment_intent === 'string' ? session.payment_intent : null;
      const reserva = await aprobarReservacionStripe(reservationId, pi);
      if (reserva) await enviarBoletosDeReserva(reservationId);
      return true;
    }
  } catch (e) {
    console.error('confirmarReservacionStripe:', e);
  }
  return false;
}
