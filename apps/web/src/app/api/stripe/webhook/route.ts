import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, stripeHabilitado } from '@/lib/stripe';
import { aprobarReservacionStripe } from '@/lib/repo';
import { enviarBoletosDeReserva } from '@/lib/notificar';

// Stripe firma cada evento; hay que leer el cuerpo CRUDO para verificar la firma.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/stripe/webhook
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeHabilitado() || !secret) {
    return NextResponse.json({ error: 'Webhook de Stripe no configurado' }, { status: 503 });
  }

  const stripe = getStripe();
  const sig = req.headers.get('stripe-signature');
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig ?? '', secret);
  } catch (e) {
    return NextResponse.json(
      { error: `Firma inválida: ${e instanceof Error ? e.message : 'desconocido'}` },
      { status: 400 }
    );
  }

  // Pago confirmado -> aprueba la reservación y envía los boletos.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const reservationId = session.metadata?.reservationId;
    if (session.payment_status === 'paid' && reservationId) {
      const pi = typeof session.payment_intent === 'string' ? session.payment_intent : null;
      const reserva = await aprobarReservacionStripe(reservationId, pi);
      if (reserva) await enviarBoletosDeReserva(reservationId);
    }
  }

  return NextResponse.json({ received: true });
}
