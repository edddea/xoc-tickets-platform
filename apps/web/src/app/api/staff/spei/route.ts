import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listarSpeiCuentas, agregarSpeiCuenta } from '@/lib/repo';
import { serialize } from '@/lib/utils';

// GET /api/staff/spei -> lista las cuentas SPEI del staff autenticado
export async function GET() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const cuentas = await listarSpeiCuentas(uid);
  return NextResponse.json(serialize(cuentas));
}

// POST /api/staff/spei -> agrega una nueva cuenta SPEI
export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { alias, banco, clabe, beneficiario } = await req.json();
  try {
    const cuenta = await agregarSpeiCuenta(uid, { alias, banco, clabe, beneficiario });
    return NextResponse.json(serialize(cuenta), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Datos inválidos' }, { status: 400 });
  }
}
