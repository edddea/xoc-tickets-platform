import { NextRequest, NextResponse } from 'next/server';
import { generarReservacion, marcarSesionStripe } from '@/lib/repo';
import { getStripe, stripeHabilitado } from '@/lib/stripe';
import type { CrearReservacionInput } from '@xoc/shared';

// POST /api/reservations -> generateReservation
// ENDPOINT PÚBLICO (sin login). El comprador llena el form.
// - Evento SPEI:   crea la reservación (en_revision) y adjunta comprobante -> se aprueba manual.
// - Evento Stripe: crea la reservación (pendiente) y devuelve una Checkout Session para pagar con tarjeta.
// TODO: añadir rate-limit + captcha antes de producción.
export async function POST(req: NextRequest) {
  let body: CrearReservacionInput;
  try {
    body = (await req.json()) as CrearReservacionInput;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const c = body.cliente;
  if (!body.eventId || !c?.nombre || !c?.correo || !c?.telefono || !body.items?.length) {
    return NextResponse.json({ error: 'Faltan datos de contacto o items' }, { status: 400 });
  }

  let res;
  try {
    res = await generarReservacion(body);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al generar reservación' },
      { status: 400 }
    );
  }

  // Evento con cobro por tarjeta: crea la sesión de pago de Stripe.
  if (res.metodo === 'stripe') {
    if (!stripeHabilitado()) {
      return NextResponse.json({ error: 'El pago con tarjeta no está configurado todavía.' }, { status: 503 });
    }
    try {
      const stripe = getStripe();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: body.cliente.correo,
        line_items: [{
          price_data: {
            currency: 'mxn',
            product_data: { name: `Boletos — ${res.eventoTitulo}` },
            unit_amount: Math.round(res.total * 100), // MXN -> centavos
          },
          quantity: 1,
        }],
        metadata: { reservationId: res.reservationId, lookupToken: res.lookupToken },
        payment_intent_data: { metadata: { reservationId: res.reservationId } },
        success_url: `${appUrl}/orden/${res.lookupToken}?pago=ok`,
        cancel_url: `${appUrl}/evento/${body.eventId}?pago=cancelado`,
      });
      await marcarSesionStripe(res.reservationId, session.id);
      return NextResponse.json({ checkoutUrl: session.url, lookupToken: res.lookupToken }, { status: 201 });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Error al iniciar el pago con Stripe' },
        { status: 500 }
      );
    }
  }

  // Evento SPEI: se devuelve el lookupToken para redirigir a /orden/<token>.
  return NextResponse.json(res, { status: 201 });
}
