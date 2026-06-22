import { NextRequest, NextResponse } from 'next/server';
import { obtenerEvento } from '@/lib/repo';
import { serialize } from '@/lib/utils';

// GET /api/events/:id  -> detalle de evento (Objeto Evento)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const evento = await obtenerEvento(id);
  if (!evento) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(serialize(evento));
}
