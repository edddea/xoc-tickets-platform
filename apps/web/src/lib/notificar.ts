import { ObjectId } from 'mongodb';
import { col } from './db';
import { enviarBoletos } from './mail';

/**
 * Envía por correo los boletos (con QR) de una reservación ya aprobada.
 * Reutilizable desde la aprobación manual (SPEI) y el webhook de Stripe.
 * No lanza: si algo falla, lo registra y sigue.
 */
export async function enviarBoletosDeReserva(reservationId: string): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) return;
  try {
    const [reservationsCol, clientesCol, ticketsCol, eventosCol] = await Promise.all([
      col('reservations'), col('clients'), col('tickets'), col('events'),
    ]);

    const reserva = await reservationsCol.findOne({ _id: new ObjectId(reservationId) });
    if (!reserva) return;

    const [cliente, tickets, evento] = await Promise.all([
      clientesCol.findOne({ _id: reserva.clientId }),
      ticketsCol.find({ reservationId: reserva._id }).toArray(),
      eventosCol.findOne({ _id: reserva.eventId }),
    ]);
    if (!cliente || !evento || !tickets.length) return;

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
      ordenId: reservationId,
      lookupToken: reserva.lookupToken,
      tickets: tickets.map((t) => ({
        id: t._id.toString(),
        qrToken: t.qrToken,
        seccion: secciones.find((s) => s._id.equals(t.seccionId))?.nombre ?? 'General',
      })),
    });
  } catch (err) {
    console.error('Error enviando boletos por correo:', err);
  }
}
