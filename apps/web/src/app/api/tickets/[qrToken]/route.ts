import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { obtenerTicketPorQr } from '@/lib/repo';
import { serialize } from '@/lib/utils';

// GET /api/tickets/:qrToken -> getTicketById (lo que lee la cámara del validador).
// Requiere sesión de staff.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ qrToken: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { qrToken } = await ctx.params;
  const ticket = await obtenerTicketPorQr(qrToken);
  if (!ticket) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(serialize(ticket));
}
