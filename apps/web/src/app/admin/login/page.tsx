'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn('credentials', { correo, password, redirect: false });
    if (res?.error) setError('Credenciales inválidas');
    else window.location.href = '/admin';
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Acceso staff</h1>
      <p className="text-sm text-neutral-500">Solo organizadores, validadores y admin.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input className="w-full rounded border border-neutral-300 px-3 py-2" type="email"
          placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <input className="w-full rounded border border-neutral-300 px-3 py-2" type="password"
          placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">
          Entrar
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
