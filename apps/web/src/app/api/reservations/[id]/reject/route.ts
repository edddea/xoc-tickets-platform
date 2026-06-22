import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rechazarReservacion } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import type { UserRole } from '@xoc/shared';

// POST /api/reservations/:id/reject -> rechaza y libera capacidad.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  if (!session || (role !== 'admin' && role !== 'organizador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const reserva = await rechazarReservacion(id);
  return NextResponse.json(serialize(reserva));
}
