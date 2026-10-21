'use client';

import { useState } from 'react';

// Botón para guardar/compartir el enlace de la orden (acceso sin cuenta).
export default function CompartirOrden() {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const url = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    // En móvil usa el share nativo; si no, copia al portapapeles.
    if (navigator.share) {
      try { await navigator.share({ title: 'Mi orden — Xoc Tickets', url }); return; } catch { /* cancelado */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* sin portapapeles */ }
  }

  return (
    <button
      onClick={compartir}
      className="inline-flex items-center gap-2 rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
    >
      {copiado ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          ¡Enlace copiado!
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Guardar / compartir enlace
        </>
      )}
    </button>
  );
}
