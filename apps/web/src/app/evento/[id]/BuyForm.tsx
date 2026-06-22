'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Evento, ItemCompra } from '@xoc/shared';

interface SpeiInfo {
  banco: string;
  clabe: string;
  beneficiario: string;
}

export default function BuyForm({ evento, spei }: { evento: Evento; spei: SpeiInfo | null }) {
  const router = useRouter();
  const [cant, setCant] = useState<Record<string, number>>({});
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', correo: '', edad: '' });
  const [voucher, setVoucher] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    return evento.secciones.reduce((acc, s) => acc + (cant[s._id] || 0) * s.costo, 0);
  }, [cant, evento.secciones]);

  function setQty(seccionId: string, delta: number) {
    setCant((c) => ({ ...c, [seccionId]: Math.min(20, Math.max(0, (c[seccionId] || 0) + delta)) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items: ItemCompra[] = evento.secciones
      .filter((s) => (cant[s._id] || 0) > 0)
      .map((s) => ({ seccionId: s._id, cantidad: cant[s._id] }));

    if (!items.length) return setError('Selecciona al menos un boleto.');
    if (!cliente.nombre || !cliente.correo || !cliente.telefono)
      return setError('Completa tus datos de contacto.');
    if (!voucher) return setError('Adjunta tu comprobante de pago SPEI.');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', voucher);
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!up.ok) throw new Error('No se pudo subir el comprobante.');
      const { url } = await up.json();

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: evento._id,
          cliente: {
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            correo: cliente.correo,
            edad: cliente.edad ? Number(cliente.edad) : null,
            direccion: null,
          },
          items,
          voucherUrl: url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reservar.');
      router.push(`/orden/${data.lookupToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  const inp = 'w-full rounded border border-neutral-300 px-3 py-2 text-sm';

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Comprar boletos</h2>
      <p className="text-sm text-neutral-500">No necesitas crear cuenta.</p>

      {/* Selector de boletos */}
      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium text-neutral-700">¿Cuántos boletos quieres?</p>
        {evento.secciones.map((s) => (
          <div key={s._id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{s.nombre}</p>
              <p className="text-xs text-neutral-400">${s.costo.toLocaleString('es-MX')} c/u</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setQty(s._id, -1)}
                disabled={(cant[s._id] || 0) === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-lg font-medium text-neutral-600 disabled:opacity-30 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                −
              </button>
              <span className="w-5 text-center text-sm font-semibold">{cant[s._id] || 0}</span>
              <button type="button"
                onClick={() => setQty(s._id, 1)}
                disabled={(cant[s._id] || 0) >= 20}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-lg font-medium text-neutral-600 disabled:opacity-30 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Datos de contacto */}
      <div className="mt-5 space-y-2">
        <p className="text-sm font-medium text-neutral-700">Tus datos de contacto</p>
        <input className={inp} placeholder="Nombre completo *"
          value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
        <input className={inp} placeholder="Correo electrónico *" type="email"
          value={cliente.correo} onChange={(e) => setCliente({ ...cliente, correo: e.target.value })} />
        <input className={inp} placeholder="Teléfono *"
          value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
        <input className={inp} placeholder="Edad"
          value={cliente.edad} onChange={(e) => setCliente({ ...cliente, edad: e.target.value })} />
      </div>

      {/* Datos SPEI */}
      {spei ? (
        <div className="mt-5 rounded-lg bg-neutral-50 border border-neutral-200 p-4 text-sm space-y-1">
          <p className="font-medium text-neutral-800">Realiza tu pago por SPEI a:</p>
          <p><span className="text-neutral-500">Banco:</span> {spei.banco}</p>
          <p><span className="text-neutral-500">Beneficiario:</span> {spei.beneficiario}</p>
          <p><span className="text-neutral-500">CLABE:</span> <span className="font-mono tracking-wide">{spei.clabe}</span></p>
        </div>
      ) : (
        <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          El organizador aún no ha configurado sus datos de pago SPEI.
        </div>
      )}

      {/* Comprobante */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Comprobante de pago SPEI *</label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <span className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4" />
            </svg>
            {voucher ? voucher.name : 'Seleccionar archivo'}
          </span>
          <input type="file" accept="image/*,application/pdf" className="hidden"
            onChange={(e) => setVoucher(e.target.files?.[0] ?? null)} />
        </label>
        {voucher && (
          <p className="mt-1 text-xs text-neutral-400">{(voucher.size / 1024).toFixed(0)} KB · {voucher.type || 'archivo'}</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-lg font-bold">Total: ${total.toLocaleString('es-MX')}</span>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white disabled:opacity-50">
          {loading ? 'Enviando…' : 'Reservar'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}
