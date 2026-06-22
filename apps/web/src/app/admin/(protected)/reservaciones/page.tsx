import { ObjectId } from 'mongodb';
import { col } from '@/lib/db';
import { serialize, money } from '@/lib/utils';
import RowActions from './RowActions';

export const dynamic = 'force-dynamic';

export default async function ReservacionesPage() {
  const reservations = await col('reservations');
  const pendientes = serialize<any[]>(
    await reservations.find({ paymentStatus: 'en_revision' }).sort({ createdAt: -1 }).toArray()
  );

  const clients = await col('clients');
  const eventos = await col('events');

  const rows = await Promise.all(pendientes.map(async (r) => {
    const [cliente, evento] = await Promise.all([
      clients.findOne({ _id: ObjectId.createFromHexString(r.clientId) }),
      eventos.findOne({ _id: ObjectId.createFromHexString(r.eventId) }),
    ]);
    return {
      ...r,
      clienteNombre: cliente?.nombre ?? '',
      clienteCorreo: cliente?.correo ?? '',
      clienteTelefono: cliente?.telefono ?? '',
      eventoTitulo: evento?.titulo ?? '',
      eventoFecha: evento?.fecha ? new Date(evento.fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
      eventoHora: evento?.hora ?? '',
      eventoVenue: evento?.venue ?? '',
    };
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Reservaciones por aprobar</h1>
      {rows.length === 0 ? (
        <p className="mt-4 text-neutral-500">No hay reservaciones pendientes.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r._id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.clienteNombre} · {r.clienteCorreo}</p>
                  <p className="text-sm text-neutral-500">{r.eventoTitulo} · Total: {money(r.totalPrice)}</p>
                </div>
                {r.voucherUrl && (
                  <a href={r.voucherUrl} target="_blank" rel="noreferrer"
                    className="text-sm text-emerald-600 underline">Ver comprobante</a>
                )}
              </div>
              <RowActions
                id={r._id}
                lookupToken={r.lookupToken}
                clienteNombre={r.clienteNombre}
                clienteTelefono={r.clienteTelefono}
                eventoTitulo={r.eventoTitulo}
                eventoFecha={r.eventoFecha}
                eventoHora={r.eventoHora}
                eventoVenue={r.eventoVenue}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
