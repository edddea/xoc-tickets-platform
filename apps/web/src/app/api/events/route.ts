import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { crearEvento, listarEventosPublicos } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import type { CrearEventoInput, UserRole } from '@xoc/shared';

// GET /api/events  -> getEvents (feed público)
export async function GET() {
  const eventos = await listarEventosPublicos();
  return NextResponse.json(serialize(eventos));
}

// POST /api/events -> createEvent (solo admin / organizador)
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!session || (role !== 'admin' && role !== 'organizador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = (await req.json()) as CrearEventoInput;
  if (!body.titulo || !body.fecha || !body.venue || !body.secciones?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const evento = await crearEvento(body, uid!);
  return NextResponse.json(serialize(evento), { status: 201 });
}
