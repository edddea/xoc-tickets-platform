// Acceso a datos centralizado (la "capa middleware -> DataBase" del diagrama).
import { ObjectId } from 'mongodb';
import { col } from './db';
import { randomToken } from './utils';
import type {
  CrearEventoInput, CrearReservacionInput, EventStatus
} from '@xoc/shared';
import { getMongoClient } from './db';

export async function listarEventosPublicos() {
  const events = await col('events');
  return events
    .find({ status: 'publicado', fecha: { $gte: new Date() } })
    .sort({ fecha: 1 })
    .toArray();
}

export async function obtenerEvento(id: string) {
  const events = await col('events');
  return events.findOne({ _id: new ObjectId(id) });
}

export async function crearEvento(input: CrearEventoInput, organizadorId: string) {
  const events = await col('events');
  const doc = {
    titulo: input.titulo,
    descripcion: input.descripcion,
    venue: input.venue,
    ubicacion: input.ubicacion,
    fecha: new Date(input.fecha),
    hora: input.hora,
    precioBase: input.precioBase,
    imagenes: input.imagenes ?? [],
    organizadorId: new ObjectId(organizadorId),
    capacidad: input.capacidad,
    status: (input.status ?? 'borrador') as EventStatus,
    secciones: input.secciones.map((s) => ({ _id: new ObjectId(), ...s })),
    tiposBoleto: input.tiposBoleto.map((t) => ({ _id: new ObjectId(), ...t })),
    createdAt: new Date()
  };
  const res = await events.insertOne(doc);
  return { _id: res.insertedId, ...doc };
}

// generateReservation: inserta clients + reservations + tickets en UNA transacción.
export async function generarReservacion(input: CrearReservacionInput) {
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    let resultado: { lookupToken: string; reservationId: string; total: number } | null = null;

    await session.withTransaction(async () => {
      const db = client.db(process.env.MONGODB_DB || 'xoctickets');
      const evento = await db.collection('events')
        .findOne({ _id: new ObjectId(input.eventId) }, { session });
      if (!evento) throw new Error('Evento no encontrado');

      // Calcula total y arma tickets a partir de secciones/tipos del evento.
      let total = 0;
      const ticketsDocs: Record<string, unknown>[] = [];

      const clienteRes = await db.collection('clients').insertOne({
        nombre: input.cliente.nombre,
        telefono: input.cliente.telefono,
        correo: input.cliente.correo.toLowerCase().trim(),
        edad: input.cliente.edad ?? null,
        direccion: input.cliente.direccion ?? null,
        createdAt: new Date()
      }, { session });
      const clientId = clienteRes.insertedId;

      const reservationId = new ObjectId();

      for (const item of input.items) {
        const seccion = (evento.secciones as { _id: ObjectId; costo: number }[])
          .find((s) => s._id.toString() === item.seccionId);
        if (!seccion) throw new Error('Sección inválida');
        const tipo = item.tipoId
          ? (evento.tiposBoleto as { _id: ObjectId; modificador: number }[])
              .find((t) => t._id.toString() === item.tipoId)
          : null;
        const precioUnit = seccion.costo + (tipo?.modificador ?? 0);

        for (let i = 0; i < item.cantidad; i++) {
          total += precioUnit;
          ticketsDocs.push({
            reservationId,
            eventId: evento._id,
            ownerClientId: clientId,
            seccionId: seccion._id,
            tipoId: tipo?._id ?? null,
            status: 'solicitado',
            qrToken: randomToken(16),
            scannedAt: null,
            scannedBy: null,
            createdAt: new Date()
          });
        }
      }

      const lookupToken = randomToken(20);
      await db.collection('reservations').insertOne({
        _id: reservationId,
        eventId: evento._id,
        clientId,
        totalPrice: total,
        paymentMethod: 'spei',
        paymentStatus: 'en_revision',  // pendiente de validar comprobante SPEI
        voucherUrl: input.voucherUrl ?? null,
        lookupToken,
        stripePaymentIntent: null,
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date()
      }, { session });

      if (ticketsDocs.length) {
        await db.collection('tickets').insertMany(ticketsDocs, { session });
      }

      resultado = { lookupToken, reservationId: reservationId.toString(), total };
    });

    return resultado!;
  } finally {
    await session.endSession();
  }
}

// approveReservation: valida pago y dispara generateTickets (status -> aprobado).
export async function aprobarReservacion(reservationId: string, staffId: string) {
  const reservations = await col('reservations');
  const tickets = await col('tickets');
  const _id = new ObjectId(reservationId);

  await reservations.updateOne({ _id }, {
    $set: { paymentStatus: 'aprobado', approvedBy: new ObjectId(staffId), approvedAt: new Date() }
  });
  await tickets.updateMany({ reservationId: _id }, { $set: { status: 'aprobado' } });
  return reservations.findOne({ _id });
}

export async function rechazarReservacion(reservationId: string) {
  const reservations = await col('reservations');
  const tickets = await col('tickets');
  const _id = new ObjectId(reservationId);
  await reservations.updateOne({ _id }, { $set: { paymentStatus: 'rechazado' } });
  await tickets.updateMany({ reservationId: _id }, { $set: { status: 'cancelado' } });
  return reservations.findOne({ _id });
}

export async function obtenerOrdenPorToken(token: string) {
  const reservations = await col('reservations');
  const reserva = await reservations.findOne({ lookupToken: token });
  if (!reserva) return null;
  const tickets = await col('tickets');
  const evento = await obtenerEvento(reserva.eventId.toString());
  const lista = await tickets.find({ reservationId: reserva._id }).toArray();
  return { reserva, evento, tickets: lista };
}

// getTicketById (por qrToken) y scan.
export async function obtenerTicketPorQr(qrToken: string) {
  const tickets = await col('tickets');
  return tickets.findOne({ qrToken });
}

export async function escanearTicket(qrToken: string, staffId: string) {
  const tickets = await col('tickets');
  const ticket = await tickets.findOne({ qrToken });
  if (!ticket) return { ok: false, motivo: 'no_existe' as const };
  if (ticket.status === 'scanned') return { ok: false, motivo: 'ya_escaneado' as const, ticket };
  if (ticket.status !== 'aprobado') return { ok: false, motivo: 'no_aprobado' as const, ticket };

  await tickets.updateOne({ _id: ticket._id }, {
    $set: { status: 'scanned', scannedAt: new Date(), scannedBy: new ObjectId(staffId) }
  });
  return { ok: true as const, ticket };
}
