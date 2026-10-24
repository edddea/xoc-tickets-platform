import Link from 'next/link';
import { notFound } from 'next/navigation';
import { obtenerEvento, obtenerSpeiDeEvento } from '@/lib/repo';
import { motivoVentaCerrada, MENSAJE_CIERRE, type MotivoCierre } from '@/lib/venta';
import { serialize, money } from '@/lib/utils';
import { fechaEvento } from '@/lib/fechas';
import type { Evento } from '@xoc/shared';
import BuyForm from './BuyForm';

export const dynamic = 'force-dynamic';

// Detalle de evento + formulario de compra (sin login).
export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await obtenerEvento(id);
  if (!doc) notFound();
  const ev = serialize<Evento>(doc);
  const cierre = motivoVentaCerrada(ev);

  // Cuenta SPEI asociada al evento (o la primera del organizador como respaldo).
  const cuenta = await obtenerSpeiDeEvento({ organizadorId: ev.organizadorId, speiCuentaId: ev.speiCuentaId });
  const spei = cuenta
    ? { alias: cuenta.alias ?? null, banco: cuenta.banco, beneficiario: cuenta.beneficiario, clabe: cuenta.clabe }
    : null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        {ev.imagenes?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.imagenes[0]} alt={ev.titulo} className="mb-4 w-full rounded-xl object-cover" />
        )}
        <h1 className="text-2xl font-bold">{ev.titulo}</h1>
        <p className="mt-1 text-neutral-500">{ev.venue}</p>
        <p className="text-neutral-500">
          {fechaEvento(ev.fecha)} · {ev.hora}
        </p>
        <p className="mt-4 whitespace-pre-line text-neutral-700">{ev.descripcion}</p>

        {ev.ubicacion && (
          <a
            className="mt-4 inline-block text-sm text-emerald-600 underline"
            href={`https://www.google.com/maps?q=${ev.ubicacion.lat},${ev.ubicacion.lng}`}
            target="_blank" rel="noreferrer"
          >
            Ver ubicación en el mapa
          </a>
        )}

        <h2 className="mt-6 font-semibold">Secciones</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {ev.secciones.map((s) => (
            <li key={s._id} className="flex justify-between border-b border-neutral-100 py-1">
              <span>{s.nombre}</span>
              <span className="font-medium">{ev.paymentMethod === 'gratis' ? 'Gratis' : money(s.costo)}</span>
            </li>
          ))}
        </ul>
      </div>

      {cierre ? <VentaCerrada motivo={cierre} fecha={ev.fecha} /> : <BuyForm evento={ev} spei={spei} />}
    </div>
  );
}

const TITULO_CIERRE: Record<MotivoCierre, string> = {
  pasado: 'Este evento ya pasó',
  finalizado: 'Evento finalizado',
  cancelado: 'Evento cancelado',
  agotado: 'Boletos agotados',
};

// Reemplaza al formulario de compra cuando la venta está cerrada.
function VentaCerrada({ motivo, fecha }: { motivo: MotivoCierre; fecha: string }) {
  const detalle = motivo === 'pasado'
    ? `Se realizó el ${fechaEvento(fecha)}. La venta de boletos ya cerró.`
    : MENSAJE_CIERRE[motivo];
  return (
    <div className="h-fit rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
      <p className="text-lg font-semibold">{TITULO_CIERRE[motivo]}</p>
      <p className="mt-1 text-sm text-neutral-500">{detalle}</p>
      <Link href="/" className="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
        Ver próximos eventos
      </Link>
    </div>
  );
}
