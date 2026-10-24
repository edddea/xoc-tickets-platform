import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { escanearTicket, buscarTicketPorCodigo, detalleBoleto } from '@/lib/repo';
import { puedeEscanear } from '@/lib/roles';
import type { UserRole } from '@xoc/shared';

export const dynamic = 'force-dynamic';

// POST /api/scan  { qrToken } | { codigo }
// Valida un boleto en la entrada y lo "quema" (aprobado -> scanned).
// Responde 200 con { ok, motivo?, boleto? } para cualquier resultado de negocio;
// 401/403 solo para sesión o permisos.
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!session || !uid) return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
  if (!puedeEscanear(role)) {
    return NextResponse.json({ error: 'No tienes acceso para escanear eventos' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { qrToken?: string; codigo?: string };
  let qrToken = body.qrToken?.trim();

  // Fallback manual: código corto visible en la orden.
  if (!qrToken && body.codigo) {
    const r = await buscarTicketPorCodigo(body.codigo);
    if (!('ticket' in r) || !r.ticket) return NextResponse.json({ ok: false, motivo: r.motivo });
    qrToken = r.ticket.qrToken as string;
  }
  if (!qrToken) return NextResponse.json({ error: 'Falta el código' }, { status: 400 });

  const result = await escanearTicket(qrToken, uid);
  const boleto = 'ticket' in result && result.ticket ? await detalleBoleto(result.ticket) : null;

  return NextResponse.json({
    ok: result.ok,
    motivo: result.ok ? undefined : result.motivo,
    boleto,
  });
}
