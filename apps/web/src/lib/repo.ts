// Acceso a datos centralizado (la "capa middleware -> DataBase" del diagrama).
import { ObjectId, ClientSession } from 'mongodb';
import { col } from './db';
import { randomToken } from './utils';
import type {
  CrearEventoInput, CrearReservacionInput, EventStatus
} from '@xoc/shared';
import { getMongoClient } from './db';

// ---- Cuentas SPEI del staff (un staff puede tener varias) ----

export interface SpeiCuentaInput {
  alias?: string;
  banco: string;
  beneficiario: string;
  clabe: string;
}

interface SpeiCuentaDoc {
  _id: ObjectId;
  alias: string;
  banco: string;
  beneficiario: string;
  clabe: string;
}

interface StaffDoc {
  _id: ObjectId;
  speiCuentas?: SpeiCuentaDoc[];
  spei?: { banco: string; beneficiario: string; clabe: string };
}

/** Normaliza y valida los campos de una cuenta SPEI. Lanza si son inválidos. */
function normalizarCuenta(input: SpeiCuentaInput) {
  const banco = String(input.banco ?? '').trim();
  const beneficiario = String(input.beneficiario ?? '').trim();
  const clabe = String(input.clabe ?? '').replace(/\D/g, '');
  if (!banco || !beneficiario) throw new Error('Banco y beneficiario son obligatorios');
  if (clabe.length !== 18) throw new Error('La CLABE debe tener 18 dígitos');
  const alias = String(input.alias ?? '').trim() || `${banco} ••${clabe.slice(-4)}`;
  return { alias, banco, beneficiario, clabe };
}

/**
 * Devuelve las cuentas SPEI del staff. Si aún tiene el formato antiguo
 * (objeto único `spei`), lo migra a `speiCuentas` de forma perezosa.
 */
export async function listarSpeiCuentas(uid: string) {
  const staff = await col<StaffDoc>('staff');
  const _id = new ObjectId(uid);
  const user = await staff.findOne({ _id }, { projection: { speiCuentas: 1, spei: 1 } });
  if (!user) return [];
  if (Array.isArray(user.speiCuentas)) return user.speiCuentas;
  if (user.spei?.clabe) {
    const migrada = [{
      _id: new ObjectId(),
      alias: 'Cuenta principal',
      banco: user.spei.banco,
      beneficiario: user.spei.beneficiario,
      clabe: user.spei.clabe,
    }];
    await staff.updateOne({ _id }, { $set: { speiCuentas: migrada }, $unset: { spei: '' } });
    return migrada;
  }
  return [];
}

export async function agregarSpeiCuenta(uid: string, input: SpeiCuentaInput) {
  await listarSpeiCuentas(uid); // asegura migración previa
  const staff = await col<StaffDoc>('staff');
  const cuenta = { _id: new ObjectId(), ...normalizarCuenta(input) };
  await staff.updateOne({ _id: new ObjectId(uid) }, { $push: { speiCuentas: cuenta } });
  return cuenta;
}

export async function editarSpeiCuenta(uid: string, cuentaId: string, input: SpeiCuentaInput) {
  await listarSpeiCuentas(uid);
  const staff = await col<StaffDoc>('staff');
  const n = normalizarCuenta(input);
  const res = await staff.updateOne(
    { _id: new ObjectId(uid), 'speiCuentas._id': new ObjectId(cuentaId) },
    {
      $set: {
        'speiCuentas.$.alias': n.alias,
        'speiCuentas.$.banco': n.banco,
        'speiCuentas.$.beneficiario': n.beneficiario,
        'speiCuentas.$.clabe': n.clabe,
      },
    }
  );
  return res.matchedCount > 0;
}

export async function eliminarSpeiCuenta(uid: string, cuentaId: string) {
  const staff = await col<StaffDoc>('staff');
  const res = await staff.updateOne(
    { _id: new ObjectId(uid) },
    { $pull: { speiCuentas: { _id: new ObjectId(cuentaId) } } }
  );
  return res.modifiedCount > 0;
}

/** Resuelve la cuenta SPEI que debe mostrarse a los compradores de un evento. */
export async function obtenerSpeiDeEvento(evento: {
  organizadorId: ObjectId | string;
  speiCuentaId?: ObjectId | string | null;
}) {
  const cuentas = await listarSpeiCuentas(evento.organizadorId.toString());
  if (!cuentas.length) return null;
  if (evento.speiCuentaId) {
    const objetivo = evento.speiCuentaId.toString();
    const match = cuentas.find((c) => c._id?.toString() === objetivo);
    if (match) return match;
  }
  return cuentas[0]; // fallback: primera cuenta disponible
}

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
    paymentMethod: (input.paymentMethod ?? 'spei'),
    speiCuentaId: input.speiCuentaId ? new ObjectId(input.speiCuentaId) : null,
    createdAt: new Date()
  };
  const res = await events.insertOne(doc);
  return { _id: res.insertedId, ...doc };
}

/**
 * Actualiza un evento existente. Verifica permisos: admin puede editar cualquiera,
 * un organizador solo los suyos. Devuelve null si no existe o no tiene permiso.
 */
export async function actualizarEvento(
  eventId: string,
  input: CrearEventoInput,
  uid: string,
  role?: string
) {
  const events = await col('events');
  const _id = new ObjectId(eventId);
  const actual = await events.findOne({ _id });
  if (!actual) return { error: 'no_encontrado' as const };
  if (role !== 'admin' && actual.organizadorId?.toString() !== uid) {
    return { error: 'sin_permiso' as const };
  }

  const set = {
    titulo: input.titulo,
    descripcion: input.descripcion,
    venue: input.venue,
    ubicacion: input.ubicacion,
    fecha: new Date(input.fecha),
    hora: input.hora,
    precioBase: input.precioBase,
    imagenes: input.imagenes ?? [],
    capacidad: input.capacidad,
    status: (input.status ?? actual.status) as EventStatus,
    secciones: input.secciones.map((s) => ({ _id: new ObjectId(), ...s })),
    tiposBoleto: input.tiposBoleto.map((t) => ({ _id: new ObjectId(), ...t })),
    paymentMethod: (input.paymentMethod ?? 'spei'),
    speiCuentaId: input.speiCuentaId ? new ObjectId(input.speiCuentaId) : null,
    updatedAt: new Date(),
  };
  await events.updateOne({ _id }, { $set: set });
  return { evento: await events.findOne({ _id }) };
}

/**
 * Eventos visibles para un miembro del staff:
 * - admin: todos los eventos (activos y pasados)
 * - organizador/otros: solo los que organiza
 * Cada evento incluye un resumen con total de reservaciones y cuántas están
 * pendientes de aprobar (para mostrar indicadores en el menú).
 */
export async function listarEventosDeStaff(uid: string, role?: string) {
  const events = await col('events');
  const filtro = role === 'admin' ? {} : { organizadorId: new ObjectId(uid) };
  const lista = await events.find(filtro).sort({ fecha: -1 }).toArray();
  if (!lista.length) return [];

  const reservations = await col('reservations');
  const ids = lista.map((e) => e._id);
  const agg = await reservations.aggregate([
    { $match: { eventId: { $in: ids } } },
    {
      $group: {
        _id: '$eventId',
        total: { $sum: 1 },
        pendientes: {
          $sum: { $cond: [{ $in: ['$paymentStatus', ['en_revision', 'pendiente']] }, 1, 0] },
        },
      },
    },
  ]).toArray();
  const resumen = new Map(agg.map((a) => [a._id.toString(), { total: a.total as number, pendientes: a.pendientes as number }]));

  return lista.map((e) => ({
    ...e,
    resumen: resumen.get(e._id.toString()) ?? { total: 0, pendientes: 0 },
  }));
}

/**
 * Un evento con todas sus reservaciones, y por cada reservación sus boletos
 * (con status) y datos del cliente. Usado en el detalle de "Mis eventos".
 */
export async function obtenerEventoConReservaciones(eventId: string) {
  const events = await col('events');
  const evento = await events.findOne({ _id: new ObjectId(eventId) });
  if (!evento) return null;

  const [reservationsCol, ticketsCol, clientsCol] = await Promise.all([
    col('reservations'), col('tickets'), col('clients'),
  ]);

  const reservas = await reservationsCol.find({ eventId: evento._id }).sort({ createdAt: -1 }).toArray();
  const [clientes, tickets] = await Promise.all([
    clientsCol.find({ _id: { $in: reservas.map((r) => r.clientId) } }).toArray(),
    ticketsCol.find({ eventId: evento._id }).toArray(),
  ]);

  const clientePorId = new Map(clientes.map((c) => [c._id.toString(), c]));
  const seccionPorId = new Map(
    ((evento.secciones ?? []) as { _id: ObjectId; nombre: string }[]).map((s) => [s._id.toString(), s.nombre])
  );

  const ticketsPorReserva = new Map<string, unknown[]>();
  for (const t of tickets) {
    const k = t.reservationId.toString();
    if (!ticketsPorReserva.has(k)) ticketsPorReserva.set(k, []);
    ticketsPorReserva.get(k)!.push({
      _id: t._id,
      status: t.status,
      seccion: seccionPorId.get(t.seccionId?.toString()) ?? 'General',
      codigo: t._id.toString().slice(-6).toUpperCase(),
    });
  }

  return {
    evento,
    reservas: reservas.map((r) => {
      const cli = clientePorId.get(r.clientId.toString());
      return {
        ...r,
        cliente: cli ? { nombre: cli.nombre, correo: cli.correo, telefono: cli.telefono } : null,
        tickets: ticketsPorReserva.get(r._id.toString()) ?? [],
      };
    }),
  };
}

// generateReservation: inserta clients + reservations + tickets.
// Usa una transacción cuando el Mongo la soporta (replica set / Atlas). En un
// Mongo standalone (dev local) hace fallback a inserciones sin transacción.
type ReservaResultado = { lookupToken: string; reservationId: string; total: number; metodo: 'spei' | 'stripe'; eventoTitulo: string };

export async function generarReservacion(input: CrearReservacionInput): Promise<ReservaResultado> {
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || 'xoctickets');

  const hacerReserva = async (session?: ClientSession): Promise<ReservaResultado> => {
    const evento = await db.collection('events').findOne({ _id: new ObjectId(input.eventId) }, { session });
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
      createdAt: new Date(),
    }, { session });
    const clientId = clienteRes.insertedId;
    const reservationId = new ObjectId();

    for (const item of input.items) {
      const seccion = (evento.secciones as { _id: ObjectId; costo: number }[])
        .find((s) => s._id.toString() === item.seccionId);
      if (!seccion) throw new Error('Sección inválida');
      const tipo = item.tipoId
        ? (evento.tiposBoleto as { _id: ObjectId; modificador: number }[]).find((t) => t._id.toString() === item.tipoId)
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
          createdAt: new Date(),
        });
      }
    }

    // El método de cobro lo decide el evento (autoritativo del servidor), no el cliente.
    const metodo: 'spei' | 'stripe' = evento.paymentMethod === 'stripe' ? 'stripe' : 'spei';
    const feePct = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '5');
    const platformFee = metodo === 'stripe' ? Math.round((total * feePct) / 100) : null;
    const organizerNet = metodo === 'stripe' ? total - (platformFee ?? 0) : null;

    const lookupToken = randomToken(20);
    await db.collection('reservations').insertOne({
      _id: reservationId,
      eventId: evento._id,
      clientId,
      totalPrice: total,
      paymentMethod: metodo,
      // SPEI: en_revision (validación manual del comprobante). Stripe: pendiente hasta que el webhook confirme el pago.
      paymentStatus: metodo === 'stripe' ? 'pendiente' : 'en_revision',
      voucherUrl: metodo === 'spei' ? (input.voucherUrl ?? null) : null,
      lookupToken,
      stripePaymentIntent: null,
      stripeSessionId: null,
      platformFee,
      organizerNet,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
    }, { session });

    if (ticketsDocs.length) {
      await db.collection('tickets').insertMany(ticketsDocs, { session });
    }

    return { lookupToken, reservationId: reservationId.toString(), total, metodo, eventoTitulo: String(evento.titulo ?? 'Boletos') };
  };

  const session = client.startSession();
  try {
    let resultado: ReservaResultado | null = null;
    await session.withTransaction(async () => { resultado = await hacerReserva(session); });
    return resultado!;
  } catch (e) {
    // Mongo standalone (dev) no soporta transacciones: reintenta sin sesión.
    const msg = e instanceof Error ? e.message : '';
    if (/replica set|Transaction numbers|mongos/i.test(msg)) {
      return await hacerReserva(undefined);
    }
    throw e;
  } finally {
    await session.endSession();
  }
}

// Guarda el id de la Checkout Session de Stripe en la reservación (para trazabilidad).
export async function marcarSesionStripe(reservationId: string, sessionId: string) {
  const reservations = await col('reservations');
  await reservations.updateOne(
    { _id: new ObjectId(reservationId) },
    { $set: { stripeSessionId: sessionId } }
  );
}

// Aprobación automática cuando Stripe confirma el pago (desde el webhook). Idempotente.
export async function aprobarReservacionStripe(reservationId: string, paymentIntentId: string | null) {
  const reservations = await col('reservations');
  const tickets = await col('tickets');
  const _id = new ObjectId(reservationId);
  const reserva = await reservations.findOne({ _id });
  if (!reserva) return null;
  if (reserva.paymentStatus === 'aprobado') return reserva; // ya procesada
  await reservations.updateOne({ _id }, {
    $set: { paymentStatus: 'aprobado', stripePaymentIntent: paymentIntentId, approvedAt: new Date() }
  });
  await tickets.updateMany({ reservationId: _id }, { $set: { status: 'aprobado' } });
  return reservations.findOne({ _id });
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
