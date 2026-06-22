import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { col } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@xoc/shared';

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Solo el administrador puede crear staff.' }, { status: 403 });
  }

  const { nombre, correo, password, rol } = await req.json();

  if (!nombre || !correo || !password || !rol) {
    return NextResponse.json({ error: 'Completa todos los campos.' }, { status: 400 });
  }
  if (!['admin', 'organizador', 'validador'].includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
  }

  const staff = await col('staff');
  const existe = await staff.findOne({ correo: correo.toLowerCase().trim() });
  if (existe) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese correo.' }, { status: 409 });
  }

  await staff.insertOne({
    nombre,
    correo: correo.toLowerCase().trim(),
    role: rol as UserRole,
    passwordHash: await bcrypt.hash(password, 10),
    eventIds: [],
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
