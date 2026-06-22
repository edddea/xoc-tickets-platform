import { NextRequest, NextResponse } from 'next/server';
import { randomToken } from '@/lib/utils';

// POST /api/upload -> sube comprobante SPEI o imagen de evento.
// Si BLOB_READ_WRITE_TOKEN está configurado usa Vercel Blob (producción),
// si no, guarda en public/uploads/ (solo en desarrollo local).
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Falta archivo' }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 8MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${randomToken(12)}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`uploads/${filename}`, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      return NextResponse.json({ url: blob.url });
    }

    // En producción NO hay filesystem escribible: el token es obligatorio.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Almacenamiento no configurado: falta BLOB_READ_WRITE_TOKEN en el entorno de producción.' },
        { status: 500 }
      );
    }

    // Fallback local (solo desarrollo)
    const { writeFile } = await import('fs/promises');
    const path = await import('path');
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(process.cwd(), 'public', 'uploads', filename), buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error('Error en /api/upload:', err);
    const msg = err instanceof Error ? err.message : 'Error desconocido al subir el archivo.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
