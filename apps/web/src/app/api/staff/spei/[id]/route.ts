import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { editarSpeiCuenta, eliminarSpeiCuenta } from '@/lib/repo';

// PATCH /api/staff/spei/:id -> edita una cuenta SPEI del staff autenticado
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const { alias, banco, clabe, beneficiario } = await req.json();
  try {
    const ok = await editarSpeiCuenta(uid, id, { alias, banco, clabe, beneficiario });
    if (!ok) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Datos inválidos' }, { status: 400 });
  }
}

// DELETE /api/staff/spei/:id -> elimina una cuenta SPEI del staff autenticado
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const ok = await eliminarSpeiCuenta(uid, id);
  if (!ok) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
