import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listarEventosDeStaff } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import { inicioDeHoy, fechaEvento } from '@/lib/fechas';
import type { UserRole } from '@xoc/shared';

export const dynamic = 'force-dynamic';

type EventoResumen = {
  _id: string;
  titulo: string;
  venue: string;
  fecha: string;
  resumen: { total: number; pendientes: number };
};

export default async function MisEventosPage() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  if (!uid) return <p className="text-neutral-500">No autenticado.</p>;

  const eventos = serialize<EventoResumen[]>(await listarEventosDeStaff(uid, role));
  const hoy = inicioDeHoy().getTime();

  return (
    <div>
      <h1 className="text-2xl font-bold">Mis eventos</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {role === 'admin' ? 'Todos los eventos (activos y pasados).' : 'Los eventos que organizas.'}{' '}
        Entra a un evento para ver sus reservaciones y boletos.
      </p>

      {eventos.length === 0 ? (
        <p className="mt-6 text-neutral-500">Aún no tienes eventos.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {eventos.map((e) => {
            const pasado = new Date(e.fecha).getTime() < hoy;
            const { pendientes, total } = e.resumen;
            return (
              <Link
                key={e._id}
                href={`/admin/mis-eventos/${e._id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{e.titulo}</p>
                    {pasado && (
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                        Pasado
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-neutral-500">
                    {fechaEvento(e.fecha, { dateStyle: 'medium' })} · {e.venue}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {pendientes > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      {pendientes} por aprobar
                    </span>
                  ) : total > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Al día
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-400">
                      Sin reservaciones
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
