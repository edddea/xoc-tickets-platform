import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { escanearTicket } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import type { UserRole } from '@xoc/shared';

// POST /api/tickets/:qrToken/scan -> Ticket Update (status = scanned) + syncEventTickets
// Solo validador / organizador / admin. Rechaza dobles escaneos.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ qrToken: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!session || !role) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { qrToken } = await ctx.params;
  const result = await escanearTicket(qrToken, uid!);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, motivo: result.motivo, ticket: result.ticket ? serialize(result.ticket) : null },
      { status: result.motivo === 'no_existe' ? 404 : 409 }
    );
  }
  return NextResponse.json({ ok: true, ticket: serialize(result.ticket) });
}
