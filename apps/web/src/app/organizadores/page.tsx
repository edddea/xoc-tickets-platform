import type { Metadata } from 'next';
import LogoXoc from '@/components/LogoXoc';

export const metadata: Metadata = {
  title: 'Publica tus eventos — Xoc Tickets',
  description: 'Guía para organizadores: cómo publicar y vender boletos para tus eventos en Xoc Tickets.',
};

const WHATSAPP = '525516487273';
const WHATSAPP_MSG = 'Hola, me interesa publicar mis eventos en Xoc Tickets.';
const EMAIL = 'contacto@xoc-tickets.com';

const PASOS: { titulo: string; texto: string; icono: React.ReactNode }[] = [
  {
    titulo: 'Te damos tu cuenta',
    texto: 'Te proporcionamos un usuario y contraseña de organizador. Entras a la plataforma con esas credenciales — sin instalar nada.',
    icono: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    ),
  },
  {
    titulo: 'Creas tu evento',
    texto: 'Capturas los datos de tu evento y lo publicas en un par de minutos. Puedes guardarlo como borrador y publicarlo cuando estés listo.',
    icono: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    ),
  },
  {
    titulo: 'Se pone a la venta',
    texto: 'Tu evento aparece en el catálogo. Los asistentes compran sus boletos en línea (sin crear cuenta) y pagan por transferencia SPEI directo a la cuenta bancaria que registraste.',
    icono: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
  },
  {
    titulo: 'Confirmas y se envían los boletos',
    texto: 'Revisas el comprobante de pago, apruebas la reservación y los boletos con código QR se envían al comprador por correo y WhatsApp. El dinero llega directo a tu cuenta.',
    icono: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

const DATOS = [
  'Título y descripción del evento',
  'Lugar / venue y ubicación en el mapa',
  'Fecha y hora',
  'Flyer o imagen de portada',
  'Secciones o zonas (VIP, General, Palco…) con su capacidad y precio',
  'Tipos de boleto (Adulto, Estudiante, Niño…) con ajuste de precio',
  'Tu cuenta SPEI (banco, beneficiario y CLABE) donde recibirás los pagos',
];

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-3xl pb-4">
      {/* Hero */}
      <section className="reveal text-center">
        <LogoXoc className="mx-auto h-20 w-auto sm:h-28" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Publica y vende boletos para tus eventos
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-500">
          Con Xoc Tickets tú te enfocas en tu evento y nosotros en la venta de boletos.
          Te damos una cuenta, publicas tu evento y los asistentes te pagan directo por SPEI.
        </p>
      </section>

      {/* Pasos */}
      <section className="mt-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Cómo funciona
        </h2>
        <ol className="mt-6 space-y-4">
          {PASOS.map((p, i) => (
            <li
              key={i}
              className="reveal flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              style={{ animationDelay: `${0.1 + i * 0.12}s` }}
            >
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {p.icono}
                  </svg>
                </div>
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0 pt-1">
                <h3 className="font-semibold">{p.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-500">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Datos que pedimos */}
      <section className="reveal mt-12 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-lg font-semibold">¿Qué datos te pediremos al crear tu evento?</h2>
        <ul className="mt-4 space-y-2.5">
          {DATOS.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {d}
            </li>
          ))}
        </ul>
      </section>

      {/* Pagos SPEI */}
      <section className="reveal mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6" style={{ animationDelay: '0.2s' }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
          <span>🏦</span> Los pagos llegan directo a ti
        </h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          Los asistentes pagan por transferencia <strong>SPEI</strong> a la cuenta bancaria (CLABE) que tú
          registras. Adjuntan su comprobante, tú lo confirmas y liberas los boletos. Sin intermediarios en tu
          dinero: cada venta cae directo en tu cuenta.
        </p>
      </section>

      {/* Contacto */}
      <section className="reveal mt-12 rounded-2xl bg-neutral-900 p-8 text-center text-white" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold">¿Quieres publicar tus eventos con nosotros?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-300">
          Escríbenos y te damos de alta con tu cuenta de organizador para que empieces a vender.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Escríbenos por WhatsApp"
            title="Escríbenos por WhatsApp"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1ebe5d]"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.522 5.83L.057 23.885a.5.5 0 0 0 .606.613l6.218-1.43A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.001-1.37l-.359-.214-3.724.856.89-3.617-.234-.373A9.818 9.818 0 1 1 12 21.818z"/>
            </svg>
          </a>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent('Quiero publicar mis eventos en Xoc Tickets')}`}
            aria-label="Escríbenos por correo"
            title="Escríbenos por correo"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
