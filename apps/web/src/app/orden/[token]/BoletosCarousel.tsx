'use client';

import { useState } from 'react';

type Boleto = { codigo: string; qr: string; seccion: string; status: string };

// Muestra los boletos de uno en uno (QR grande) para escanear sin que el lector
// capte más de un código. Navegación con botones, puntos y swipe en móvil.
export default function BoletosCarousel({ boletos }: { boletos: Boleto[] }) {
  const [i, setI] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const n = boletos.length;
  if (!n) return null;

  const b = boletos[Math.min(i, n - 1)];
  const ir = (d: number) => setI((x) => (x + d + n) % n);

  const navBtn = 'rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors';

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-500">Boleto {i + 1} de {n}</p>
        {b.seccion && (
          <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-xs font-medium text-neutral-600">{b.seccion}</span>
        )}
      </div>

      <div
        className="mt-4 flex select-none flex-col items-center"
        onTouchStart={(e) => setStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (startX === null) return;
          const dx = e.changedTouches[0].clientX - startX;
          if (dx > 40) ir(-1);
          else if (dx < -40) ir(1);
          setStartX(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.qr} alt={`QR del boleto ${b.codigo}`} className="h-64 w-64" />
        <p className="mt-3 font-mono text-lg font-semibold tracking-widest text-neutral-800">{b.codigo}</p>
        <p className="text-xs text-neutral-400">Presenta este código en la entrada</p>
      </div>

      {n > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={() => ir(-1)} className={navBtn}>← Anterior</button>
          <div className="flex gap-1.5">
            {boletos.map((_, j) => (
              <button
                key={j}
                type="button"
                onClick={() => setI(j)}
                aria-label={`Ir al boleto ${j + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${j === i ? 'bg-emerald-600' : 'bg-neutral-300 hover:bg-neutral-400'}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => ir(1)} className={navBtn}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}
