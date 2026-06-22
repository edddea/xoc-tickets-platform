'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  lookupToken: string;
  clienteNombre: string;
  clienteTelefono: string;
  eventoTitulo: string;
  eventoFecha: string;
  eventoHora: string;
  eventoVenue: string;
}

export default function RowActions({ id, lookupToken, clienteNombre, clienteTelefono, eventoTitulo, eventoFecha, eventoHora, eventoVenue }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [aprobado, setAprobado] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const ordenUrl = `${appUrl}/orden/${lookupToken}`;

  async function aprobar() {
    setBusy(true);
    const res = await fetch(`/api/reservations/${id}/approve`, { method: 'POST' });
    setBusy(false);
    if (res.ok) setAprobado(true);
  }

  async function rechazar() {
    setBusy(true);
    await fetch(`/api/reservations/${id}/reject`, { method: 'POST' });
    setBusy(false);
    router.refresh();
  }

  function whatsappUrl() {
    const telefono = clienteTelefono.replace(/\D/g, '');
    const numero = telefono.startsWith('52') ? telefono : `52${telefono}`;
    const mensaje = [
      `¡Hola ${clienteNombre}! 👋`,
      ``,
      `Tus boletos para *${eventoTitulo}* han sido confirmados. 🎉`,
      ``,
      `📅 ${eventoFecha}`,
      `🕐 ${eventoHora} hrs`,
      `📍 ${eventoVenue}`,
      ``,
      `Presenta el código QR de cada boleto en la entrada:`,
      ordenUrl,
      ``,
      `— Xoc Tickets`,
    ].join('\n');
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  }

  if (aprobado) {
    return (
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-emerald-600">✓ Aprobado — correo enviado</span>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1ebe5d] transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.522 5.83L.057 23.885a.5.5 0 0 0 .606.613l6.218-1.43A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.001-1.37l-.359-.214-3.724.856.89-3.617-.234-.373A9.818 9.818 0 1 1 12 21.818z"/>
          </svg>
          Enviar por WhatsApp
        </a>
        <button onClick={() => router.refresh()} className="text-sm text-neutral-400 hover:text-neutral-600">
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      <button disabled={busy} onClick={aprobar}
        className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
        {busy ? 'Procesando…' : 'Aprobar y enviar boletos'}
      </button>
      <button disabled={busy} onClick={rechazar}
        className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-50">
        Rechazar
      </button>
    </div>
  );
}
