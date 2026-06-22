'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CrearEventoInput } from '@xoc/shared';
import VenueMapPicker from '@/components/VenueMapPicker';

type SeccionForm = { nombre: string; capacidad: number; costo: number };
type TipoForm = { nombre: string; modificador: number };

export default function NuevoEventoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: '', descripcion: '', venue: '', fecha: '', hora: '',
    precioBase: 0, capacidad: 0, lat: '', lng: '', imagen: '',
  });
  const [secciones, setSecciones] = useState<SeccionForm[]>([{ nombre: 'General', capacidad: 100, costo: 250 }]);
  const [tipos, setTipos] = useState<TipoForm[]>([{ nombre: 'Adulto', modificador: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function guardar(status: 'borrador' | 'publicado') {
    setError(null);
    if (!form.titulo || !form.venue || !form.fecha || !form.hora) {
      return setError('Completa título, venue, fecha y hora.');
    }
    setLoading(true);
    const payload: CrearEventoInput = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      venue: form.venue,
      ubicacion: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined,
      fecha: form.fecha,
      hora: form.hora,
      precioBase: Number(form.precioBase),
      imagenes: form.imagen ? [form.imagen] : [],
      capacidad: Number(form.capacidad),
      status,
      secciones: secciones.map((s) => ({ ...s, capacidad: Number(s.capacidad), costo: Number(s.costo) })),
      tiposBoleto: tipos.map((t) => ({ ...t, modificador: Number(t.modificador) })),
    };
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); return setError(d.error || 'Error al guardar.'); }
    router.push('/admin');
  }

  const inp = 'w-full rounded border border-neutral-300 px-3 py-2 text-sm';
  const label = 'block text-sm font-medium text-neutral-700 mb-1';
  const hint = 'mt-1 text-xs text-neutral-400';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Nuevo evento</h1>

      <div className="mt-6 space-y-4">

        <div>
          <label className={label}>Título *</label>
          <input className={inp} placeholder="Ej. Festival de Jazz 2026" value={form.titulo} onChange={(e) => up('titulo', e.target.value)} />
        </div>

        <div>
          <label className={label}>Descripción</label>
          <textarea className={inp} placeholder="Describe el evento: artistas, programa, restricciones de edad, etc." rows={3} value={form.descripcion} onChange={(e) => up('descripcion', e.target.value)} />
        </div>

        <div>
          <label className={label}>Venue / lugar *</label>
          <input className={inp} placeholder="Ej. Foro Sol, Ciudad de México" value={form.venue} onChange={(e) => up('venue', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Fecha *</label>
            <input className={inp} type="date" value={form.fecha} onChange={(e) => up('fecha', e.target.value)} />
          </div>
          <div>
            <label className={label}>Hora de inicio *</label>
            <input className={inp} type="time" value={form.hora} onChange={(e) => up('hora', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Precio base (MXN)</label>
            <input className={inp} type="number" min={0} placeholder="0" value={form.precioBase} onChange={(e) => up('precioBase', Number(e.target.value))} />
            <p className={hint}>Precio de referencia general del evento.</p>
          </div>
          <div>
            <label className={label}>Capacidad total</label>
            <input className={inp} type="number" min={0} placeholder="0" value={form.capacidad} onChange={(e) => up('capacidad', Number(e.target.value))} />
            <p className={hint}>Número máximo de asistentes en todo el evento.</p>
          </div>
        </div>

        <div>
          <label className={label}>Flyer / imagen de portada</label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
              {uploadingImg ? 'Subiendo…' : '📎 Seleccionar imagen'}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingImg}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingImg(true);
                  setError(null);
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.url) up('imagen', data.url);
                    else setError(data.error || `Error al subir imagen (HTTP ${res.status}).`);
                  } catch {
                    setError('Error de red al subir la imagen.');
                  } finally {
                    setUploadingImg(false);
                  }
                }} />
            </label>
            {form.imagen && (
              <img src={form.imagen} alt="portada" className="h-16 w-16 rounded object-cover border border-neutral-200" />
            )}
          </div>
          {form.imagen && (
            <p className={hint + ' mt-1'}>{form.imagen}</p>
          )}
        </div>

        <div>
          <label className={label}>Ubicación en el mapa <span className="font-normal text-neutral-400">(opcional)</span></label>
          <VenueMapPicker
            lat={form.lat}
            lng={form.lng}
            onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
          />
        </div>

        {/* Secciones */}
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="mb-1 font-medium">Secciones del evento</p>
          <p className="mb-3 text-xs text-neutral-400">Divide el aforo por zonas (VIP, General, Palco, etc.). Cada sección tiene su propio precio y capacidad.</p>
          {secciones.map((s, i) => (
            <div key={i} className="mb-3 grid grid-cols-3 gap-2">
              <div>
                {i === 0 && <p className="mb-1 text-xs text-neutral-500">Nombre de sección</p>}
                <input className={inp} placeholder="Ej. VIP" value={s.nombre}
                  onChange={(e) => setSecciones((a) => a.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} />
              </div>
              <div>
                {i === 0 && <p className="mb-1 text-xs text-neutral-500">Capacidad (personas)</p>}
                <input className={inp} type="number" min={0} placeholder="0" value={s.capacidad}
                  onChange={(e) => setSecciones((a) => a.map((x, j) => j === i ? { ...x, capacidad: Number(e.target.value) } : x))} />
              </div>
              <div>
                {i === 0 && <p className="mb-1 text-xs text-neutral-500">Precio (MXN)</p>}
                <input className={inp} type="number" min={0} placeholder="0" value={s.costo}
                  onChange={(e) => setSecciones((a) => a.map((x, j) => j === i ? { ...x, costo: Number(e.target.value) } : x))} />
              </div>
            </div>
          ))}
          <button type="button" className="text-sm text-emerald-600"
            onClick={() => setSecciones((a) => [...a, { nombre: '', capacidad: 0, costo: 0 }])}>+ Agregar sección</button>
        </div>

        {/* Tipos de boleto */}
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="mb-1 font-medium">Tipos de boleto</p>
          <p className="mb-3 text-xs text-neutral-400">Define categorías de compradores (Adulto, Estudiante, Niño, etc.). El modificador ajusta el precio de la sección: positivo suma, negativo descuenta.</p>
          {tipos.map((t, i) => (
            <div key={i} className="mb-3 grid grid-cols-2 gap-2">
              <div>
                {i === 0 && <p className="mb-1 text-xs text-neutral-500">Tipo de boleto</p>}
                <input className={inp} placeholder="Ej. Estudiante" value={t.nombre}
                  onChange={(e) => setTipos((a) => a.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} />
              </div>
              <div>
                {i === 0 && <p className="mb-1 text-xs text-neutral-500">Modificador de precio (MXN)</p>}
                <input className={inp} type="number" placeholder="Ej. -50 (descuento) o 100 (cargo extra)" value={t.modificador}
                  onChange={(e) => setTipos((a) => a.map((x, j) => j === i ? { ...x, modificador: Number(e.target.value) } : x))} />
              </div>
            </div>
          ))}
          <button type="button" className="text-sm text-emerald-600"
            onClick={() => setTipos((a) => [...a, { nombre: '', modificador: 0 }])}>+ Agregar tipo</button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button disabled={loading} onClick={() => guardar('borrador')}
            className="rounded-lg border border-neutral-300 px-4 py-2 font-medium">Guardar borrador</button>
          <button disabled={loading} onClick={() => guardar('publicado')}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50">
            {loading ? 'Guardando…' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
