import Link from 'next/link';
import { listarEventosPublicos, listarEventosPasados } from '@/lib/repo';
import { serialize, money } from '@/lib/utils';
import { fechaEvento } from '@/lib/fechas';
import type { Evento } from '@xoc/shared';
import LogoXoc from '@/components/LogoXoc';

export const dynamic = 'force-dynamic';

// Feed público de eventos (Comprar ticket -> Seleccionar evento) + eventos pasados.
export default async function Home() {
  const [proximosDocs, pasadosDocs] = await Promise.all([listarEventosPublicos(), listarEventosPasados()]);
  const eventos = serialize<Evento[]>(proximosDocs);
  const pasados = serialize<Evento[]>(pasadosDocs);

  return (
    <div>
      {/* Hero: logo en primer plano, centrado, con vaivén suave */}
      <div className="flex justify-center pt-4 pb-10 sm:pt-8 sm:pb-14">
        <LogoXoc className="h-28 w-auto sm:h-40" />
      </div>

      <h1 className="mb-6 text-2xl font-bold">Eventos disponibles</h1>
      {eventos.length === 0 ? (
        <p className="text-neutral-500">No hay eventos próximos por ahora.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((ev) => (
            <Link
              key={ev._id}
              href={`/evento/${ev._id}`}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video bg-neutral-100">
                {ev.imagenes?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.imagenes[0]} alt={ev.titulo} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold">{ev.titulo}</h2>
                <p className="text-sm text-neutral-500">{ev.venue}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {fechaEvento(ev.fecha)} · {ev.hora}
                </p>
                <p className="mt-2 font-medium text-emerald-600">
                  {ev.paymentMethod === 'gratis' ? 'Gratis' : `desde ${money(ev.precioBase)}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Eventos pasados */}
      {pasados.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold">Eventos pasados</h2>
          <p className="mt-1 mb-5 text-sm text-neutral-500">Algunos de los eventos que se han vivido con Xoc Tickets.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pasados.map((ev) => (
              <Link
                key={ev._id}
                href={`/evento/${ev._id}`}
                className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-video bg-neutral-100">
                  {ev.imagenes?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.imagenes[0]} alt={ev.titulo}
                      className="h-full w-full object-cover grayscale transition duration-300 group-hover:grayscale-0" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-white">
                    Finalizado
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-neutral-700">{ev.titulo}</h3>
                  <p className="text-sm text-neutral-500">{ev.venue}</p>
                  <p className="mt-1 text-sm text-neutral-400">{fechaEvento(ev.fecha)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
