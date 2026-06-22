import QRCode from 'qrcode';
import { obtenerOrdenPorToken } from '@/lib/repo';
import { serialize, money } from '@/lib/utils';
import type { Evento, Reservacion, Ticket } from '@xoc/shared';

export const dynamic = 'force-dynamic';

const ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión — validando tu comprobante SPEI',
  aprobado: '¡Aprobada! Tus boletos están listos',
  rechazado: 'Rechazada — contacta al organizador',
};

// Consulta de orden del invitado por lookupToken (sin login).
export default async function OrdenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await obtenerOrdenPorToken(token);
  if (!data) return <p className="text-neutral-500">Orden no encontrada.</p>;

  const reserva = serialize<Reservacion>(data.reserva);
  const evento = serialize<Evento>(data.evento);
  const tickets = serialize<Ticket[]>(data.tickets);

  // Genera QR solo si está aprobada.
  const qrs: Record<string, string> = {};
  if (reserva.paymentStatus === 'aprobado') {
    for (const t of tickets) qrs[t._id] = await QRCode.toDataURL(t.qrToken);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">{evento?.titulo}</h1>
      <p className="text-neutral-500">Orden #{reserva._id.slice(-6).toUpperCase()}</p>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-medium">Estado: {ESTADO[reserva.paymentStatus]}</p>
        <p className="mt-1 text-sm text-neutral-500">Total: {money(reserva.totalPrice)}</p>
      </div>

      <h2 className="mt-6 font-semibold">Tus boletos ({tickets.length})</h2>
      <div className="mt-3 space-y-3">
        {tickets.map((t) => (
          <div key={t._id} className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="h-24 w-24 shrink-0 bg-neutral-100">
              {qrs[t._id]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={qrs[t._id]} alt="QR" className="h-full w-full" />
                : <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400 text-center">QR disponible al aprobar</div>}
            </div>
            <div className="text-sm">
              <p className="font-medium">Boleto {t._id.slice(-6).toUpperCase()}</p>
              <p className="text-neutral-500">Estado: {t.status}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        Guarda este enlace: es tu acceso a la orden sin necesidad de cuenta.
      </p>
    </div>
  );
}
