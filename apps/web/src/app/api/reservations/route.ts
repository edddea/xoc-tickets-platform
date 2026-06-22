import { NextRequest, NextResponse } from 'next/server';
import { generarReservacion } from '@/lib/repo';
import type { CrearReservacionInput } from '@xoc/shared';

// POST /api/reservations -> generateReservation
// ENDPOINT PÚBLICO (sin login). El comprador llena el form y adjunta comprobante.
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

  try {
    const res = await generarReservacion(body);
    // Devuelve el lookupToken para redirigir a /orden/<token>
    return NextResponse.json(res, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al generar reservación' },
      { status: 400 }
    );
  }
}
