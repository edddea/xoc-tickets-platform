import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { obtenerEventoConReservaciones } from '@/lib/repo';
import { serialize, money } from '@/lib/utils';
import type { UserRole } from '@xoc/shared';
import RowActions from './RowActions';

export const dynamic = 'force-dynamic';

// Metadatos visuales por status de boleto.
const TICKET_META: Record<string, { label: string; dot: string; text: string }> = {
  solicitado: { label: 'Por aprobar', dot: 'bg-amber-400',   text: 'text-amber-700' },
  aprobado:   { label: 'Aprobado',    dot: 'bg-emerald-500', text: 'text-emerald-700' },
  scanned:    { label: 'Ingresó',     dot: 'bg-blue-500',    text: 'text-blue-700' },
  cancelado:  { label: 'Rechazado',   dot: 'bg-red-500',     text: 'text-red-700' },
};
const TICKET_FALLBACK = { label: 'Desconocido', dot: 'bg-neutral-300', text: 'text-neutral-500' };

type Ticket = { _id: string; status: string; seccion: string; codigo: string };
type Reserva = {
  _id: string;
  lookupToken: string;
  totalPrice: number;
  paymentStatus: string;
  paymentMethod?: string;
  voucherUrl?: string | null;
  createdAt: string;
  cliente: { nombre: string; correo: string; telefono: string } | null;
  tickets: Ticket[];
};

// Estado agregado de una reservación, derivado de sus boletos.
function estadoReserva(r: Reserva): { label: string; cls: string } {
  const n = r.tickets.length;
  const scanned = r.tickets.filter((t) => t.status === 'scanned').length;
  if (r.paymentStatus === 'rechazado') return { label: 'Rechazada', cls: 'bg-red-100 text-red-700' };
  if (n > 0 && scanned === n) return { label: 'Completada — todos ingresaron', cls: 'bg-blue-100 text-blue-700' };
  if (r.paymentStatus === 'aprobado') {
    return {
      label: scanned > 0 ? `Aprobada · ${scanned}/${n} ingresaron` : 'Aprobada',
      cls: 'bg-emerald-100 text-emerald-700',
    };
  }
  // Pendiente: Stripe espera el pago con tarjeta; SPEI espera aprobación manual del comprobante.
  if (r.paymentMethod === 'stripe') return { label: 'Pendiente de pago', cls: 'bg-amber-100 text-amber-700' };
  const porAprobar = r.tickets.filter((t) => t.status === 'solicitado').length || n;
  return { label: `${porAprobar} boleto${porAprobar === 1 ? '' : 's'} por aprobar`, cls: 'bg-amber-100 text-amber-700' };
}

export default async function EventoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  const role = (session?.user as { role?: UserRole } | undefined)?.role;

  const data = await obtenerEventoConReservaciones(id);
  if (!data) notFound();

  const evento = serialize<any>(data.evento);
  const reservas = serialize<Reserva[]>(data.reservas);

  // Autorización: un organizador solo ve sus propios eventos.
  if (role !== 'admin' && evento.organizadorId !== uid) {
    return <p className="text-neutral-500">No tienes permiso para ver este evento.</p>;
  }

  const fechaLarga = new Date(evento.fecha).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Contadores de cabecera (a nivel reservación).
  const cont = { porAprobar: 0, aprobadas: 0, ingresadas: 0, rechazadas: 0 };
  for (const r of reservas) {
    if (r.paymentStatus === 'rechazado') cont.rechazadas++;
    else if (r.tickets.length > 0 && r.tickets.every((t) => t.status === 'scanned')) cont.ingresadas++;
    else if (r.paymentStatus === 'aprobado') cont.aprobadas++;
    else cont.porAprobar++;
  }

  // Total de boletos aprobados en todas las reservaciones (incluye los que ya ingresaron,
  // ya que un boleto escaneado también pasó por aprobación).
  const boletosAprobados = reservas.reduce(
    (acc, r) => acc + r.tickets.filter((t) => t.status === 'aprobado' || t.status === 'scanned').length,
    0
  );

  const chip = (n: number, label: string, cls: string) => (
    <div className={`rounded-lg px-3 py-2 text-center ${cls}`}>
      <p className="text-lg font-bold leading-none">{n}</p>
      <p className="mt-1 text-[11px] font-medium">{label}</p>
    </div>
  );

  const cobroLabel =
    evento.paymentMethod === 'stripe' ? '💳 Tarjeta (Stripe)'
    : evento.paymentMethod === 'gratis' ? '🎟️ Gratis (reservación)'
    : '🏦 Transferencia SPEI';

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{evento.titulo}</h1>
          <p className="mt-1 text-sm text-neutral-500">{fechaLarga} · {evento.hora} · {evento.venue}</p>
          <p className="mt-1 text-xs text-neutral-400">Cobro: {cobroLabel}</p>
        </div>
        <Link href={`/admin/mis-eventos/${id}/editar`}
          className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 transition-colors">
          ✏️ Editar
        </Link>
      </div>

      {/* Resumen (por reservación) */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {chip(cont.porAprobar, 'Por aprobar', 'bg-amber-50 text-amber-700')}
        {chip(cont.aprobadas, 'Aprobadas', 'bg-emerald-50 text-emerald-700')}
        {chip(cont.ingresadas, 'Ingresaron', 'bg-blue-50 text-blue-700')}
        {chip(cont.rechazadas, 'Rechazadas', 'bg-red-50 text-red-700')}
      </div>

      {/* Total de boletos aprobados (a nivel boleto, sumando todas las reservaciones) */}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-600 px-4 py-3 text-white">
        <span className="text-sm font-medium">🎟️ Boletos aprobados en total</span>
        <span className="text-2xl font-bold leading-none">{boletosAprobados}</span>
      </div>

      {/* Leyenda de colores de boleto */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
        {Object.entries(TICKET_META).map(([k, m]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
            {m.label}
          </span>
        ))}
      </div>

      <h2 className="mt-6 font-semibold">Reservaciones ({reservas.length})</h2>

      {reservas.length === 0 ? (
        <p className="mt-3 text-neutral-500">Este evento aún no tiene reservaciones.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {reservas.map((r) => {
            const est = estadoReserva(r);
            // Solo SPEI se aprueba a mano; Stripe se aprueba solo al confirmarse el pago.
            const puedeAprobarManual = r.paymentMethod === 'spei'
              && (r.paymentStatus === 'en_revision' || r.paymentStatus === 'pendiente');
            // Conteo de boletos por status para el resumen del desplegable.
            const counts: Record<string, number> = {};
            for (const t of r.tickets) counts[t.status] = (counts[t.status] ?? 0) + 1;

            return (
              <div key={r._id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.cliente?.nombre || 'Cliente'}</p>
                    <p className="truncate text-sm text-neutral-500">
                      {r.cliente?.correo}{r.cliente?.telefono ? ` · ${r.cliente.telefono}` : ''}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {money(r.totalPrice)} · {new Date(r.createdAt).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${est.cls}`}>
                    {est.label}
                  </span>
                </div>

                {/* Boletos */}
                <details className="mt-3 group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-neutral-600">
                    <span className="text-neutral-400 group-open:rotate-90 transition-transform">▸</span>
                    Boletos ({r.tickets.length})
                    <span className="ml-1 flex items-center gap-1.5">
                      {Object.entries(counts).map(([status, n]) => {
                        const m = TICKET_META[status] ?? TICKET_FALLBACK;
                        return (
                          <span key={status} className="inline-flex items-center gap-1 text-xs text-neutral-500">
                            <span className={`h-2 w-2 rounded-full ${m.dot}`} />{n}
                          </span>
                        );
                      })}
                    </span>
                  </summary>
                  <ul className="mt-2 space-y-1 border-t border-neutral-100 pt-2">
                    {r.tickets.map((t) => {
                      const m = TICKET_META[t.status] ?? TICKET_FALLBACK;
                      return (
                        <li key={t._id} className="flex items-center gap-2 text-sm">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${m.dot}`} />
                          <span className="font-mono text-xs text-neutral-600">{t.codigo}</span>
                          <span className="text-neutral-500">{t.seccion}</span>
                          <span className={`ml-auto text-xs font-medium ${m.text}`}>{m.label}</span>
                        </li>
                      );
                    })}
                    {r.tickets.length === 0 && <li className="text-sm text-neutral-400">Sin boletos.</li>}
                  </ul>
                </details>

                {r.voucherUrl && (
                  <a href={r.voucherUrl} target="_blank" rel="noreferrer"
                    className="mt-2 inline-block text-sm text-emerald-600 underline">
                    Ver comprobante SPEI
                  </a>
                )}

                {/* Acciones solo para SPEI pendiente de aprobar */}
                {puedeAprobarManual && r.cliente && (
                  <RowActions
                    id={r._id}
                    lookupToken={r.lookupToken}
                    clienteNombre={r.cliente.nombre}
                    clienteTelefono={r.cliente.telefono}
                    eventoTitulo={evento.titulo}
                    eventoFecha={fechaLarga}
                    eventoHora={evento.hora}
                    eventoVenue={evento.venue}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
