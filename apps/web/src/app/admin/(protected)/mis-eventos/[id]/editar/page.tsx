import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { obtenerEvento } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import type { Evento, UserRole } from '@xoc/shared';
import EventoForm from '../../../eventos/EventoForm';

export const dynamic = 'force-dynamic';

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  const role = (session?.user as { role?: UserRole } | undefined)?.role;

  const doc = await obtenerEvento(id);
  if (!doc) notFound();
  const evento = serialize<Evento>(doc);

  if (role !== 'admin' && evento.organizadorId !== uid) {
    return <p className="text-neutral-500">No tienes permiso para editar este evento.</p>;
  }

  return <EventoForm evento={evento} />;
}
