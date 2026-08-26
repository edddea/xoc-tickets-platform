'use client';

import { useState } from 'react';
import type { SpeiCuenta } from '@xoc/shared';

type FormState = { id: string | null; alias: string; banco: string; beneficiario: string; clabe: string };

const VACIO: FormState = { id: null, alias: '', banco: '', beneficiario: '', clabe: '' };

export default function SpeiAccounts({ cuentasIniciales }: { cuentasIniciales: SpeiCuenta[] }) {
  const [cuentas, setCuentas] = useState<SpeiCuenta[]>(cuentasIniciales);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full rounded border border-neutral-300 px-3 py-2 text-sm';
  const label = 'block text-sm font-medium text-neutral-700 mb-1';

  async function recargar() {
    const res = await fetch('/api/staff/spei');
    if (res.ok) setCuentas(await res.json());
  }

  function abrirNueva() {
    setError('');
    setForm({ ...VACIO });
  }

  function abrirEdicion(c: SpeiCuenta) {
    setError('');
    setForm({ id: c._id, alias: c.alias, banco: c.banco, beneficiario: c.beneficiario, clabe: c.clabe });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.banco.trim() || !form.beneficiario.trim()) return setError('Banco y beneficiario son obligatorios.');
    if (form.clabe.replace(/\D/g, '').length !== 18) return setError('La CLABE debe tener 18 dígitos.');

    setSaving(true);
    setError('');
    const body = JSON.stringify({
      alias: form.alias, banco: form.banco, beneficiario: form.beneficiario, clabe: form.clabe,
    });
    const res = form.id
      ? await fetch(`/api/staff/spei/${form.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
      : await fetch('/api/staff/spei', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    setSaving(false);

    if (res.ok) {
      setForm(null);
      await recargar();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Error al guardar. Intenta de nuevo.');
    }
  }

  async function eliminar(c: SpeiCuenta) {
    if (!confirm(`¿Eliminar la cuenta "${c.alias}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/staff/spei/${c._id}`, { method: 'DELETE' });
    if (res.ok) await recargar();
    else setError('No se pudo eliminar la cuenta.');
  }

  return (
    <div className="mt-6">
      {/* Listado */}
      {cuentas.length === 0 && !form && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          Aún no tienes cuentas SPEI registradas.
        </div>
      )}

      <div className="space-y-3">
        {cuentas.map((c) => (
          <div key={c._id} className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="font-semibold">{c.alias}</p>
              <p className="text-sm text-neutral-500">{c.banco} · {c.beneficiario}</p>
              <p className="mt-1 font-mono text-sm tracking-wide text-neutral-700">{c.clabe}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => abrirEdicion(c)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 transition-colors">
                Editar
              </button>
              <button onClick={() => eliminar(c)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:border-red-400 hover:bg-red-50 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de alta/edición */}
      {form ? (
        <form onSubmit={guardar} className="mt-4 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
          <p className="font-semibold">{form.id ? 'Editar cuenta' : 'Nueva cuenta SPEI'}</p>
          <div>
            <label className={label}>Alias <span className="font-normal text-neutral-400">(opcional)</span></label>
            <input className={inp} placeholder="Ej. Cuenta principal BBVA"
              value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
          </div>
          <div>
            <label className={label}>Banco</label>
            <input className={inp} placeholder="Ej. STP, BBVA, Banamex"
              value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} />
          </div>
          <div>
            <label className={label}>Beneficiario</label>
            <input className={inp} placeholder="Nombre tal como aparece en la cuenta"
              value={form.beneficiario} onChange={(e) => setForm({ ...form, beneficiario: e.target.value })} />
          </div>
          <div>
            <label className={label}>CLABE (18 dígitos)</label>
            <input className={inp} placeholder="000000000000000000" maxLength={18} inputMode="numeric"
              value={form.clabe} onChange={(e) => setForm({ ...form, clabe: e.target.value.replace(/\D/g, '') })} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Agregar cuenta'}
            </button>
            <button type="button" onClick={() => { setForm(null); setError(''); }}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={abrirNueva}
          className="mt-4 rounded-lg border border-dashed border-neutral-300 px-4 py-2.5 text-sm font-medium text-emerald-600 hover:border-emerald-500 transition-colors">
          + Agregar cuenta
        </button>
      )}
    </div>
  );
}
