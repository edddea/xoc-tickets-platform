// ============================================================
// XOC-TICKETS · Esquema MongoDB (Atlas)
// Correr con:  mongosh "<MONGODB_URI>" mongodb-schema.js
// Mapea 1:1 los objetos y colecciones del diagrama de refactor.
// Colecciones: events, clients, reservations, tickets, staff
// Seguridad: NO hay RLS en Mongo -> la autorización se hace en la
// capa de API (middleware). Esto solo define forma e índices.
// ============================================================

const db = db.getSiblingDB('xoctickets');

// Helpers de enum para validación
const TICKET_STATUS  = ['solicitado', 'aprobado', 'cancelado', 'scanned'];
const PAYMENT_STATUS = ['pendiente', 'en_revision', 'aprobado', 'rechazado'];
const PAYMENT_METHOD = ['spei', 'stripe', 'efectivo'];
const EVENT_STATUS   = ['borrador', 'publicado', 'agotado', 'cancelado', 'finalizado'];
const USER_ROLE      = ['admin', 'organizador', 'validador'];

// ------------------------------------------------------------
// STAFF  (solo usuarios que inician sesión: admin/organizador/validador)
// El comprador NO existe aquí: es invitado.
// ------------------------------------------------------------
db.createCollection('staff', {
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['correo', 'role', 'createdAt'],
    properties: {
      correo:    { bsonType: 'string' },
      nombre:    { bsonType: 'string' },
      role:      { enum: USER_ROLE },
      // eventos asignados (para validador / organizador asistente)
      eventIds:  { bsonType: 'array', items: { bsonType: 'objectId' } },
      createdAt: { bsonType: 'date' }
    }
  } }
});
db.staff.createIndex({ correo: 1 }, { unique: true });

// ------------------------------------------------------------
// OBJETO EVENTO  ->  collection events
// Secciones y tipos de boleto EMBEBIDOS (ventaja no-relacional)
// ------------------------------------------------------------
db.createCollection('events', {
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['titulo', 'descripcion', 'venue', 'fecha', 'hora',
               'precioBase', 'organizadorId', 'capacidad', 'status', 'createdAt'],
    properties: {
      titulo:       { bsonType: 'string' },
      descripcion:  { bsonType: 'string' },
      venue:        { bsonType: 'string' },
      // Ubicación Google Maps (input con marcador)
      ubicacion:    { bsonType: 'object', properties: {
                        lat: { bsonType: 'double' },
                        lng: { bsonType: 'double' } } },
      fecha:        { bsonType: 'date' },
      hora:         { bsonType: 'string' },          // "20:00"
      precioBase:   { bsonType: ['double', 'int'] },
      imagenes:     { bsonType: 'array', items: { bsonType: 'string' } }, // URLs Vercel Blob
      organizadorId:{ bsonType: 'objectId' },
      capacidad:    { bsonType: 'int' },
      status:       { enum: EVENT_STATUS },
      // OBJETO SECCION embebido (capacidad, costo)
      secciones:    { bsonType: 'array', items: { bsonType: 'object',
                        required: ['nombre', 'capacidad', 'costo'],
                        properties: {
                          _id:       { bsonType: 'objectId' },
                          nombre:    { bsonType: 'string' },
                          capacidad: { bsonType: 'int' },
                          costo:     { bsonType: ['double', 'int'] } } } },
      // tipos de boleto embebidos
      tiposBoleto:  { bsonType: 'array', items: { bsonType: 'object',
                        required: ['nombre'],
                        properties: {
                          _id:        { bsonType: 'objectId' },
                          nombre:     { bsonType: 'string' },
                          modificador:{ bsonType: ['double', 'int'] } } } },
      createdAt:    { bsonType: 'date' }
    }
  } }
});
db.events.createIndex({ status: 1, fecha: 1 });   // feed público (getEvents)
db.events.createIndex({ organizadorId: 1 });

// ------------------------------------------------------------
// OBJETO CLIENTE  ->  collection clients   (siempre invitado)
// ------------------------------------------------------------
db.createCollection('clients', {
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['nombre', 'telefono', 'correo', 'createdAt'],
    properties: {
      nombre:    { bsonType: 'string' },
      telefono:  { bsonType: 'string' },
      correo:    { bsonType: 'string' },
      edad:      { bsonType: ['int', 'null'] },
      direccion: { bsonType: ['string', 'null'] },
      createdAt: { bsonType: 'date' }
    }
  } }
});
db.clients.createIndex({ correo: 1 });

// ------------------------------------------------------------
// OBJETO RESERVACION  ->  collection reservations
// (tickets, evento asociado, cliente, total price, voucher, payment status)
// lookupToken: acceso del invitado sin login
// ------------------------------------------------------------
db.createCollection('reservations', {
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['eventId', 'clientId', 'totalPrice', 'paymentMethod',
               'paymentStatus', 'lookupToken', 'createdAt'],
    properties: {
      eventId:        { bsonType: 'objectId' },
      clientId:       { bsonType: 'objectId' },
      totalPrice:     { bsonType: ['double', 'int'] },
      paymentMethod:  { enum: PAYMENT_METHOD },
      paymentStatus:  { enum: PAYMENT_STATUS },
      voucherUrl:     { bsonType: ['string', 'null'] },     // comprobante SPEI (Vercel Blob)
      lookupToken:    { bsonType: 'string' },               // enlace /orden/<token>
      stripePaymentIntent: { bsonType: ['string', 'null'] },// listo para Stripe
      approvedBy:     { bsonType: ['objectId', 'null'] },
      approvedAt:     { bsonType: ['date', 'null'] },
      createdAt:      { bsonType: 'date' }
    }
  } }
});
db.reservations.createIndex({ lookupToken: 1 }, { unique: true });
db.reservations.createIndex({ eventId: 1 });
db.reservations.createIndex({ paymentStatus: 1 });

// ------------------------------------------------------------
// OBJETO TICKET  ->  collection tickets
// (owner, seccion, tipo, evento asociado, status)
// ------------------------------------------------------------
db.createCollection('tickets', {
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['reservationId', 'eventId', 'ownerClientId',
               'seccionId', 'status', 'qrToken', 'createdAt'],
    properties: {
      reservationId: { bsonType: 'objectId' },
      eventId:       { bsonType: 'objectId' },
      ownerClientId: { bsonType: 'objectId' },              // owner
      seccionId:     { bsonType: 'objectId' },              // ref a events.secciones._id
      tipoId:        { bsonType: ['objectId', 'null'] },    // ref a events.tiposBoleto._id
      status:        { enum: TICKET_STATUS },
      qrToken:       { bsonType: 'string' },                // getTicketById / scan
      scannedAt:     { bsonType: ['date', 'null'] },
      scannedBy:     { bsonType: ['objectId', 'null'] },
      createdAt:     { bsonType: 'date' }
    }
  } }
});
db.tickets.createIndex({ qrToken: 1 }, { unique: true });
db.tickets.createIndex({ eventId: 1 });
db.tickets.createIndex({ reservationId: 1 });

print('xoc-tickets: colecciones e índices creados.');

// ============================================================
// NOTA DE TRANSACCIÓN (generateReservation):
// Los 3 inserts del diagrama (clients + reservations + tickets) deben
// ir en una transacción de Mongo para que sea atómico:
//
//   const session = client.startSession();
//   await session.withTransaction(async () => {
//     const c = await clients.insertOne(cliente, { session });
//     const r = await reservations.insertOne({...}, { session });
//     await tickets.insertMany([...], { session });
//   });
//
// (Atlas soporta transacciones multi-documento en replica set.)
// ============================================================
