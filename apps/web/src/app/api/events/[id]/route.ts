import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { obtenerEvento, actualizarEvento } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import type { CrearEventoInput, UserRole } from '@xoc/shared';

// GET /api/events/:id  -> detalle de evento (Objeto Evento)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const evento = await obtenerEvento(id);
  if (!evento) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(serialize(evento));
}

// PATCH /api/events/:id -> editar evento (admin o el organizador dueño)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!session || (role !== 'admin' && role !== 'organizador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as CrearEventoInput;
  if (!body.titulo || !body.fecha || !body.venue || !body.secciones?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const r = await actualizarEvento(id, body, uid!, role);
  if (r.error === 'no_encontrado') return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
  if (r.error === 'sin_permiso') return NextResponse.json({ error: 'No puedes editar este evento' }, { status: 403 });
  return NextResponse.json(serialize(r.evento), { status: 200 });
}
