import { NextRequest, NextResponse } from 'next/server';
import { obtenerOrdenPorToken } from '@/lib/repo';
import { serialize } from '@/lib/utils';

// GET /api/orden/:token -> consulta pública de la orden del invitado (sin login).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const data = await obtenerOrdenPorToken(token);
  if (!data) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  return NextResponse.json(serialize(data));
}
