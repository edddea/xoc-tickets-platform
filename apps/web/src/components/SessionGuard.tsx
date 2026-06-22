'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionGuard() {
  const router = useRouter();
  const [expirada, setExpirada] = useState(false);

  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (...args) => {
      const res = await original(...args);
      if (res.status === 401) {
        // Clonar para no consumir el body
        const clone = res.clone();
        try {
          const data = await clone.json();
          if (data?.error === 'No autorizado') setExpirada(true);
        } catch {}
      }
      return res;
    };
    return () => { window.fetch = original; };
  }, []);

  function cerrarSesion() {
    router.push('/admin/login');
  }

  if (!expirada) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Sesión expirada</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tu sesión ha expirado por inactividad. Por seguridad debes volver a iniciar sesión.
        </p>
        <button
          onClick={cerrarSesion}
          className="mt-5 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          Ir a iniciar sesión
        </button>
      </div>
    </div>
  );
}
