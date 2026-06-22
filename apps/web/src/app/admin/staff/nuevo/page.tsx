'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@xoc/shared';

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'admin',       label: 'Administrador', desc: 'Acceso total: crea staff, eventos y aprueba pagos.' },
  { value: 'organizador', label: 'Organizador',    desc: 'Crea y gestiona sus propios eventos y reservaciones.' },
  { value: 'validador',   label: 'Validador',      desc: 'Solo puede escanear QR en la entrada del evento.' },
];

export default function NuevoStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'organizador' as UserRole });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full rounded border border-neutral-300 px-3 py-2 text-sm';
  const label = 'block text-sm font-medium text-neutral-700 mb-1';

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/staff/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Error al crear el usuario.');
    router.push('/admin/staff');
  }

  const rolActual = ROLES.find((r) => r.value === form.rol)!;

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold">Nuevo miembro de staff</h1>
      <p className="mt-1 text-sm text-neutral-500">Solo los administradores pueden registrar staff.</p>

      <form onSubmit={guardar} className="mt-6 space-y-4">
        <div>
          <label className={label}>Nombre completo</label>
          <input className={inp} placeholder="Ej. María García"
            value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>

        <div>
          <label className={label}>Correo electrónico</label>
          <input className={inp} type="email" placeholder="correo@ejemplo.com"
            value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
        </div>

        <div>
          <label className={label}>Contraseña</label>
          <input className={inp} type="password" placeholder="Mínimo 8 caracteres"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        <div>
          <label className={label}>Rol</label>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label key={r.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  form.rol === r.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}>
                <input type="radio" name="rol" value={r.value} checked={form.rol === r.value}
                  onChange={() => setForm({ ...form, rol: r.value })}
                  className="mt-0.5 accent-emerald-600" />
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-neutral-500">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
            {loading ? 'Creando…' : `Crear ${rolActual.label}`}
          </button>
        </div>
      </form>
    </div>
  );
}
