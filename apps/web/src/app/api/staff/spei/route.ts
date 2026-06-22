import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { col } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!session || !uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { banco, clabe, beneficiario } = await req.json();
  if (!banco || !clabe || !beneficiario) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }

  const staff = await col('staff');
  await staff.updateOne(
    { _id: new ObjectId(uid) },
    { $set: { spei: { banco, clabe, beneficiario } } }
  );

  return NextResponse.json({ ok: true });
}
