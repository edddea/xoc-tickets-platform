'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import type QrScannerType from 'qr-scanner';

type Boleto = {
  codigo: string;
  status: string;
  seccion: string;
  evento: string;
  eventoFecha: string | null;
  cliente: string;
  scannedAt: string | null;
};

type Resultado =
  | { tipo: 'ok'; boleto: Boleto }
  | { tipo: 'ya'; boleto: Boleto | null }
  | { tipo: 'invalido'; titulo: string; detalle: string; boleto: Boleto | null }
  | { tipo: 'error'; titulo: string; detalle: string; login?: boolean };

// El mismo QR se ignora durante este tiempo tras cerrar el resultado, para que el
// boleto que acaba de entrar no se vuelva a leer mientras la persona sigue mostrándolo.
const COOLDOWN_MS = 4000;
const AUTO_CONTINUAR_MS = 1800;

function interpretar(data: { ok?: boolean; motivo?: string; boleto?: Boleto | null }): Resultado {
  if (data.ok && data.boleto) return { tipo: 'ok', boleto: data.boleto };
  const boleto = data.boleto ?? null;
  switch (data.motivo) {
    case 'ya_escaneado':
      return { tipo: 'ya', boleto };
    case 'no_aprobado':
      return {
        tipo: 'invalido',
        titulo: 'BOLETO NO VÁLIDO',
        detalle: boleto?.status === 'cancelado'
          ? 'Este boleto fue cancelado o rechazado.'
          : 'El pago de este boleto aún no está aprobado.',
        boleto,
      };
    case 'ambiguo':
      return { tipo: 'invalido', titulo: 'CÓDIGO AMBIGUO', detalle: 'Hay más de un boleto con ese código. Escanea el QR.', boleto: null };
    default:
      return { tipo: 'invalido', titulo: 'NO ENCONTRADO', detalle: 'Este código no corresponde a ningún boleto.', boleto: null };
  }
}

function cuando(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString()
    ? `hoy a las ${hora}`
    : `el ${d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} a las ${hora}`;
}

function fechaEvento(iso: string | null) {
  if (!iso) return '';
  // La fecha del evento se guarda como medianoche UTC del día capturado.
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function mensajeCamara(e: unknown) {
  const txt = `${(e as { name?: string })?.name ?? ''} ${String(e)}`;
  if (/NotAllowed|Permission/i.test(txt)) return 'Permiso de cámara denegado. Actívalo en los ajustes del navegador y vuelve a intentar.';
  if (/NotFound|not found|no camera/i.test(txt)) return 'No se encontró una cámara en este dispositivo.';
  if (/NotReadable|in use/i.test(txt)) return 'La cámara está siendo usada por otra app.';
  return 'No se pudo abrir la cámara. Puedes ingresar el código manualmente.';
}

export default function Scanner({ nombre }: { nombre: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const busyRef = useRef(false);
  const lastRef = useRef<{ token: string; t: number } | null>(null);

  const [fase, setFase] = useState<'inicio' | 'escaneando'>('inicio');
  const [camError, setCamError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [admitidos, setAdmitidos] = useState(0);
  const [manual, setManual] = useState('');
  const [manualAbierto, setManualAbierto] = useState(false);

  // Vibración + tono corto según el resultado (útil para no tener que mirar la pantalla).
  const feedback = useCallback((tipo: Resultado['tipo']) => {
    try { navigator.vibrate?.(tipo === 'ok' ? 80 : [90, 70, 90]); } catch { /* sin vibración */ }
    const ctx = audioRef.current;
    if (!ctx) return;
    const tonos = tipo === 'ok' ? [880] : tipo === 'ya' ? [520, 520] : [220];
    tonos.forEach((f, i) => {
      const t0 = ctx.currentTime + i * 0.18;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (tipo === 'invalido' ? 0.4 : 0.14));
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.45);
    });
  }, []);

  const validar = useCallback(async (payload: { qrToken?: string; codigo?: string }) => {
    busyRef.current = true;
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        setResultado({ tipo: 'error', titulo: 'SESIÓN EXPIRADA', detalle: 'Toca para volver a iniciar sesión.', login: true });
        feedback('error');
        return;
      }
      if (res.status === 403) {
        setResultado({ tipo: 'error', titulo: 'SIN PERMISO', detalle: 'Tu usuario no tiene acceso para escanear eventos.' });
        feedback('error');
        return;
      }
      const r = interpretar(await res.json());
      if (r.tipo === 'ok') setAdmitidos((n) => n + 1);
      feedback(r.tipo);
      setResultado(r);
    } catch {
      setResultado({ tipo: 'error', titulo: 'SIN CONEXIÓN', detalle: 'No se pudo validar. Revisa tu internet e intenta de nuevo.' });
      feedback('error');
    }
  }, [feedback]);

  const continuar = useCallback(() => {
    if (resultado?.tipo === 'error' && resultado.login) {
      window.location.href = '/admin/login?callbackUrl=/scan';
      return;
    }
    setResultado(null);
    if (lastRef.current) lastRef.current.t = Date.now(); // el cooldown corre desde que se cierra
    busyRef.current = false;
  }, [resultado]);

  // Acceso permitido: continúa solo para no frenar la fila.
  useEffect(() => {
    if (resultado?.tipo !== 'ok') return;
    const id = setTimeout(continuar, AUTO_CONTINUAR_MS);
    return () => clearTimeout(id);
  }, [resultado, continuar]);

  async function iniciar() {
    setCamError(null);
    // iOS exige un toque del usuario para habilitar sonido y cámara.
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioRef.current = audioRef.current ?? new AC();
      await audioRef.current.resume();
    } catch { /* sin sonido */ }
    try { wakeRef.current = (await navigator.wakeLock?.request('screen')) ?? null; } catch { /* sin wake lock */ }

    if (!window.isSecureContext) {
      setCamError('La cámara solo funciona con conexión segura (HTTPS). Puedes ingresar el código manualmente.');
      return;
    }
    try {
      const { default: QrScanner } = await import('qr-scanner');
      if (!videoRef.current) return;
      scannerRef.current?.destroy();
      const scanner = new QrScanner(
        videoRef.current,
        (r) => {
          const token = r.data.trim();
          if (!token || busyRef.current) return;
          const last = lastRef.current;
          if (last && last.token === token && Date.now() - last.t < COOLDOWN_MS) return;
          lastRef.current = { token, t: Date.now() };
          validar({ qrToken: token });
        },
        {
          preferredCamera: 'environment',
          maxScansPerSecond: 12,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );
      scannerRef.current = scanner;
      await scanner.start();
      setFase('escaneando');
    } catch (e) {
      setCamError(mensajeCamara(e));
    }
  }

  // Reactiva el "mantener pantalla encendida" al volver a la pestaña.
  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState !== 'visible' || fase !== 'escaneando') return;
      try { wakeRef.current = (await navigator.wakeLock?.request('screen')) ?? null; } catch { /* nada */ }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fase]);

  // Libera cámara, audio y wake lock al salir de la pantalla.
  useEffect(() => () => {
    scannerRef.current?.destroy();
    wakeRef.current?.release().catch(() => {});
    audioRef.current?.close().catch(() => {});
  }, []);

  function onManual(e: React.FormEvent) {
    e.preventDefault();
    const codigo = manual.trim();
    if (!codigo || busyRef.current) return;
    setManual('');
    validar({ codigo });
  }

  async function salir() {
    scannerRef.current?.destroy();
    await signOut({ redirectTo: '/admin/login?callbackUrl=/scan' });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white">
      {/* Barra superior */}
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Escáner de acceso</p>
          <p className="truncate text-xs text-neutral-400">{nombre}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            {admitidos} {admitidos === 1 ? 'ingresó' : 'ingresaron'}
          </span>
          <button onClick={salir} className="text-xs text-neutral-400 hover:text-white">Salir</button>
        </div>
      </header>

      {/* Cámara */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {fase === 'inicio' && !camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <button
              onClick={iniciar}
              className="flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full bg-emerald-600 text-base font-semibold shadow-lg shadow-emerald-900/50 active:scale-95 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Iniciar
            </button>
            <p className="text-sm text-neutral-400">Toca para abrir la cámara y empezar a escanear boletos.</p>
          </div>
        )}

        {camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-base text-neutral-200">{camError}</p>
            <button onClick={iniciar} className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700">
              Reintentar
            </button>
          </div>
        )}

        {fase === 'escaneando' && !resultado && (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white/80">
            Apunta al código QR del boleto
          </p>
        )}

        {resultado && <ResultadoOverlay r={resultado} onContinuar={continuar} />}
      </div>

      {/* Respaldo manual */}
      <footer className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {manualAbierto ? (
          <form onSubmit={onManual} className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Código del boleto (ej. 15F174)"
              className="min-w-0 flex-1 rounded-lg bg-neutral-800 px-3 py-2.5 text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={24}
              autoCapitalize="characters"
              autoComplete="off"
              autoFocus
            />
            <button className="rounded-lg bg-emerald-600 px-4 text-sm font-semibold hover:bg-emerald-500">Validar</button>
          </form>
        ) : (
          <button onClick={() => setManualAbierto(true)} className="w-full py-1 text-center text-xs text-neutral-400 hover:text-neutral-200">
            ¿No lee el QR? Ingresa el código manualmente
          </button>
        )}
      </footer>
    </div>
  );
}

function ResultadoOverlay({ r, onContinuar }: { r: Resultado; onContinuar: () => void }) {
  const fondo = { ok: 'bg-emerald-600', ya: 'bg-amber-500', invalido: 'bg-red-600', error: 'bg-neutral-800' }[r.tipo];
  const titulo = r.tipo === 'ok' ? 'ACCESO PERMITIDO' : r.tipo === 'ya' ? 'YA INGRESÓ' : r.titulo;
  const detalle =
    r.tipo === 'ya' ? `Este boleto ya se validó ${cuando(r.boleto?.scannedAt ?? null)}`
    : r.tipo === 'ok' ? ''
    : r.detalle;
  const boleto = r.tipo === 'error' ? null : r.boleto;

  return (
    <button type="button" onClick={onContinuar}
      className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${fondo}`}>
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          {r.tipo === 'ok' && <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />}
          {r.tipo === 'ya' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5m0 3.5v.01" />}
          {(r.tipo === 'invalido' || r.tipo === 'error') && <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />}
        </svg>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{titulo}</p>
      {detalle && <p className="mt-2 max-w-sm text-base text-white/90">{detalle}</p>}

      {boleto && (
        <div className="mt-6 w-full max-w-sm rounded-2xl bg-black/20 p-4 text-left">
          {boleto.cliente && <p className="text-xl font-bold leading-tight">{boleto.cliente}</p>}
          <p className="mt-0.5 text-sm text-white/85">
            {boleto.evento}{boleto.eventoFecha ? ` · ${fechaEvento(boleto.eventoFecha)}` : ''}
          </p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5">{boleto.seccion || 'General'}</span>
            <span className="font-mono tracking-widest">{boleto.codigo}</span>
          </div>
        </div>
      )}

      <p className="mt-8 text-sm font-medium text-white/80">
        {r.tipo === 'ok' ? 'Siguiente en un momento…' : 'Toca para escanear el siguiente'}
      </p>
      {r.tipo === 'ok' && (
        <span
          className="absolute inset-x-0 bottom-0 h-1.5 origin-left bg-white/70"
          style={{ animation: `xoc-progress ${AUTO_CONTINUAR_MS}ms linear forwards` }}
        />
      )}
    </button>
  );
}
