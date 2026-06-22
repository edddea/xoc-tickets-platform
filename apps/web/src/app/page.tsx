import Link from 'next/link';
import { listarEventosPublicos } from '@/lib/repo';
import { serialize, money } from '@/lib/utils';
import type { Evento } from '@xoc/shared';

export const dynamic = 'force-dynamic';

// Feed público de eventos (Comprar ticket -> Seleccionar evento).
export default async function Home() {
  const eventos = serialize<Evento[]>(await listarEventosPublicos());

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Eventos disponibles</h1>
      {eventos.length === 0 ? (
        <p className="text-neutral-500">Aún no hay eventos publicados.</p>
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
                  {new Date(ev.fecha).toLocaleDateString('es-MX', { dateStyle: 'long' })} · {ev.hora}
                </p>
                <p className="mt-2 font-medium text-emerald-600">desde {money(ev.precioBase)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
