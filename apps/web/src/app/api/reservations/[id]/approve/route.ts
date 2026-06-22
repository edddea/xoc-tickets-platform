import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { aprobarReservacion } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import { enviarBoletos } from '@/lib/mail';
import { col } from '@/lib/db';
import { ObjectId } from 'mongodb';
import type { UserRole } from '@xoc/shared';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!session || (role !== 'admin' && role !== 'organizador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const reserva = await aprobarReservacion(id, uid!);
  if (!reserva) return NextResponse.json({ error: 'Reservación no encontrada' }, { status: 404 });

  if (process.env.SENDGRID_API_KEY) {
    try {
      const [clientesCol, ticketsCol, eventosCol] = await Promise.all([
        col('clients'), col('tickets'), col('events'),
      ]);

      const [cliente, tickets, evento] = await Promise.all([
        clientesCol.findOne({ _id: reserva.clientId }),
        ticketsCol.find({ reservationId: new ObjectId(id) }).toArray(),
        eventosCol.findOne({ _id: reserva.eventId }),
      ]);

      if (cliente && evento && tickets.length) {
        const secciones = (evento.secciones ?? []) as { _id: ObjectId; nombre: string }[];
        const fechaFormateada = new Date(evento.fecha).toLocaleDateString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        await enviarBoletos({
          correo: cliente.correo,
          nombre: cliente.nombre,
          eventoTitulo: evento.titulo,
          eventoFecha: `${fechaFormateada} ${evento.hora}`,
          eventoVenue: evento.venue,
          ordenId: id,
          lookupToken: reserva.lookupToken,
          tickets: tickets.map((t) => ({
            id: t._id.toString(),
            qrToken: t.qrToken,
            seccion: secciones.find((s) => s._id.equals(t.seccionId))?.nombre ?? 'General',
          })),
        });
      }
    } catch (err) {
      console.error('Error enviando correo:', err);
    }
  }

  return NextResponse.json(serialize(reserva));
}
