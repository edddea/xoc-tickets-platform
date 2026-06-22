// Tipos compartidos entre la web (Next.js) y la app móvil (Expo).
// Reflejan las colecciones de mongodb-schema.js. Los _id se serializan
// como string al pasar por la API.

export type EventStatus =
  | 'borrador' | 'publicado' | 'agotado' | 'cancelado' | 'finalizado';

export type PaymentStatus =
  | 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';

export type PaymentMethod = 'spei' | 'stripe' | 'efectivo';

export type TicketStatus =
  | 'solicitado' | 'aprobado' | 'cancelado' | 'scanned';

export type UserRole = 'admin' | 'organizador' | 'validador';

export interface Seccion {
  _id: string;
  nombre: string;
  capacidad: number;
  costo: number;
}

export interface TipoBoleto {
  _id: string;
  nombre: string;
  modificador: number;
}

export interface Evento {
  _id: string;
  titulo: string;
  descripcion: string;
  venue: string;
  ubicacion?: { lat: number; lng: number };
  fecha: string;          // ISO date
  hora: string;           // "20:00"
  precioBase: number;
  imagenes: string[];
  organizadorId: string;
  capacidad: number;
  status: EventStatus;
  secciones: Seccion[];
  tiposBoleto: TipoBoleto[];
  createdAt: string;
}

export interface Cliente {
  _id: string;
  nombre: string;
  telefono: string;
  correo: string;
  edad?: number | null;
  direccion?: string | null;
  createdAt: string;
}

export interface Reservacion {
  _id: string;
  eventId: string;
  clientId: string;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  voucherUrl?: string | null;
  lookupToken: string;
  stripePaymentIntent?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  reservationId: string;
  eventId: string;
  ownerClientId: string;
  seccionId: string;
  tipoId?: string | null;
  status: TicketStatus;
  qrToken: string;
  scannedAt?: string | null;
  scannedBy?: string | null;
  createdAt: string;
}

// ---- Payloads de API ----

export interface CrearEventoInput {
  titulo: string;
  descripcion: string;
  venue: string;
  ubicacion?: { lat: number; lng: number };
  fecha: string;
  hora: string;
  precioBase: number;
  imagenes?: string[];
  capacidad: number;
  status?: EventStatus;
  secciones: Omit<Seccion, '_id'>[];
  tiposBoleto: Omit<TipoBoleto, '_id'>[];
}

export interface ItemCompra {
  seccionId: string;
  tipoId?: string | null;
  cantidad: number;
}

export interface CrearReservacionInput {
  eventId: string;
  cliente: {
    nombre: string;
    telefono: string;
    correo: string;
    edad?: number | null;
    direccion?: string | null;
  };
  items: ItemCompra[];
  voucherUrl?: string | null;   // comprobante SPEI ya subido a Vercel Blob
}
