'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginForm() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', { correo, password, redirect: false });
    setLoading(false);
    if (res?.error) setError('Correo o contraseña incorrectos.');
    else window.location.href = '/admin';
  }

  const inp = 'w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Correo electrónico</label>
        <input className={inp} type="email" placeholder="correo@ejemplo.com"
          value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Contraseña</label>
        <input className={inp} type="password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors mt-1">
        {loading ? 'Verificando…' : 'Entrar al panel'}
      </button>
    </form>
  );
}
