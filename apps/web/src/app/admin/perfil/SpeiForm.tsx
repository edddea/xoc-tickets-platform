'use client';

import { useState } from 'react';

interface SpeiInfo {
  banco: string;
  clabe: string;
  beneficiario: string;
}

export default function SpeiForm({ uid, spei }: { uid: string; spei: SpeiInfo | null }) {
  const [form, setForm] = useState<SpeiInfo>({
    banco: spei?.banco ?? '',
    clabe: spei?.clabe ?? '',
    beneficiario: spei?.beneficiario ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full rounded border border-neutral-300 px-3 py-2 text-sm';
  const label = 'block text-sm font-medium text-neutral-700 mb-1';

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.banco || !form.clabe || !form.beneficiario)
      return setError('Completa todos los campos.');
    if (form.clabe.replace(/\D/g, '').length !== 18)
      return setError('La CLABE debe tener 18 dígitos.');
    setSaving(true);
    setError('');
    setOk(false);
    const res = await fetch('/api/staff/spei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) setOk(true);
    else setError('Error al guardar. Intenta de nuevo.');
  }

  return (
    <form onSubmit={guardar} className="mt-4 space-y-4">
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
        <input className={inp} placeholder="000000000000000000" maxLength={18}
          value={form.clabe} onChange={(e) => setForm({ ...form, clabe: e.target.value.replace(/\D/g, '') })} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-600">✓ Datos guardados correctamente.</p>}

      <button type="submit" disabled={saving}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
        {saving ? 'Guardando…' : 'Guardar datos SPEI'}
      </button>
    </form>
  );
}
