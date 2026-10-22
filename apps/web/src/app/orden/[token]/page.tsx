import QRCode from 'qrcode';
import { obtenerOrdenPorToken } from '@/lib/repo';
import { confirmarReservacionStripe } from '@/lib/stripe-sync';
import { serialize, money } from '@/lib/utils';
import type { Evento, Reservacion, Ticket } from '@xoc/shared';
import CompartirOrden from './CompartirOrden';
import RefrescarPendiente from './RefrescarPendiente';
import BoletosCarousel from './BoletosCarousel';

export const dynamic = 'force-dynamic';

// Texto de estado según el método de pago del evento.
function estadoTexto(paymentStatus: string, metodo?: string): { txt: string; cls: string } {
  if (paymentStatus === 'aprobado') {
    const txt =
      metodo === 'stripe' ? '✅ ¡Pago confirmado! Tus boletos están listos'
      : metodo === 'gratis' ? '✅ ¡Reservación confirmada! Tus boletos están listos'
      : '✅ ¡Aprobada! Tus boletos están listos';
    return { txt, cls: 'text-emerald-700' };
  }
  if (paymentStatus === 'rechazado') {
    return {
      txt: metodo === 'stripe' ? 'El pago no se completó' : 'Rechazada — contacta al organizador',
      cls: 'text-red-700',
    };
  }
  // pendiente / en_revision
  if (metodo === 'stripe') return { txt: '⏳ Procesando tu pago…', cls: 'text-amber-700' };
  if (paymentStatus === 'en_revision') return { txt: 'En revisión — validando tu comprobante SPEI', cls: 'text-amber-700' };
  return { txt: 'Pendiente', cls: 'text-amber-700' };
}

// Consulta de orden del invitado por lookupToken (sin login).
export default async function OrdenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ pago?: string }>;
}) {
  const { token } = await params;
  const { pago } = await searchParams;
  let data = await obtenerOrdenPorToken(token);
  if (!data) return <p className="text-neutral-500">Orden no encontrada.</p>;

  let reserva = serialize<Reservacion>(data.reserva);

  // Si es un pago con tarjeta pendiente, confirma directo con Stripe (respaldo del
  // webhook) para que la orden se apruebe aunque el webhook no haya llegado.
  if (reserva.paymentMethod === 'stripe' && reserva.paymentStatus === 'pendiente') {
    const aprobada = await confirmarReservacionStripe(reserva._id, reserva.stripeSessionId);
    if (aprobada) {
      data = (await obtenerOrdenPorToken(token)) ?? data;
      reserva = serialize<Reservacion>(data.reserva);
    }
  }

  const evento = serialize<Evento>(data.evento);
  const tickets = serialize<Ticket[]>(data.tickets);
  const cliente = data.cliente;

  const metodo = reserva.paymentMethod;
  const estado = estadoTexto(reserva.paymentStatus, metodo);
  const aprobada = reserva.paymentStatus === 'aprobado';
  const stripePendiente = metodo === 'stripe' && reserva.paymentStatus === 'pendiente';

  // Nombre de sección por id (para mostrarlo en cada boleto).
  const seccionPorId = new Map((evento?.secciones ?? []).map((s) => [s._id, s.nombre]));

  // Genera los boletos con QR (solo si está aprobada) para el carrusel.
  const boletos = aprobada
    ? await Promise.all(tickets.map(async (t) => ({
        codigo: t._id.slice(-6).toUpperCase(),
        qr: await QRCode.toDataURL(t.qrToken),
        seccion: seccionPorId.get(t.seccionId) ?? '',
        status: t.status,
      })))
    : [];

  return (
    <div className="mx-auto max-w-xl">
      {/* Banner de éxito tras volver de Stripe */}
      {pago === 'ok' && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          🎉 ¡Gracias por tu compra! Tu pago se está confirmando y tus boletos aparecerán aquí abajo.
        </div>
      )}

      <p className="text-sm text-neutral-500">{evento?.titulo}</p>
      {cliente?.nombre && (
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Reservación de {cliente.nombre}</h1>
      )}
      <p className="mt-1 text-neutral-500">Orden #{reserva._id.slice(-6).toUpperCase()}</p>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className={`font-medium ${estado.cls}`}>{estado.txt}</p>
        <p className="mt-1 text-sm text-neutral-500">Total: {money(reserva.totalPrice)}</p>
        {stripePendiente && <RefrescarPendiente />}
      </div>

      {/* Guardar / compartir el enlace de la orden */}
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-800">Guarda tu orden</p>
        <p className="mt-0.5 mb-3 text-sm text-neutral-500">
          Este enlace es tu acceso a los boletos (no necesitas cuenta). Cópialo o compártelo para tenerlo a la mano.
        </p>
        <CompartirOrden />
      </div>

      <h2 className="mt-6 font-semibold">Tus boletos ({tickets.length})</h2>
      <p className="mb-3 text-xs text-neutral-400">Muestra un boleto a la vez en la entrada para escanear sin confusiones.</p>
      {aprobada ? (
        <BoletosCarousel boletos={boletos} />
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          Tus {tickets.length} boleto{tickets.length === 1 ? '' : 's'} con código QR aparecerán aquí en cuanto se confirme la orden.
        </div>
      )}
    </div>
  );
}
