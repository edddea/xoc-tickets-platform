# Xoc Tickets — monorepo

Boletera para **xoc-tickets.com**. Migra el flujo de AppSheet + Google Sheets/Forms a una app propia.

```
xoc-tickets/
├─ apps/
│  ├─ web/      → Next.js (web responsive + API/middleware) — se despliega en Vercel
│  └─ mobile/   → Expo / React Native (Android) con scanner de validador
└─ packages/
   └─ shared/   → tipos TypeScript compartidos web ↔ móvil
```

## Stack
Next.js (App Router) · MongoDB Atlas · Vercel Blob (comprobantes/imágenes) · Auth.js (solo staff) · Expo (Android).

## Características
- **Feed público** de eventos (`/`).
- **Compra SIN login** (`/evento/:id`): datos de contacto + comprobante SPEI → genera un `lookupToken`.
- **Consulta de orden** sin cuenta (`/orden/:token`) con QR cuando se aprueba.
- **Panel admin** (`/admin`, protegido): crear/publicar eventos, aprobar reservaciones.
- **Scanner** de validación en puerta (app móvil).
- Roles: `admin`, `organizador`, `validador`.

## Puesta en marcha

1. Variables de entorno: copia `.env.example` a `apps/web/.env.local` y llena MongoDB, Auth y Blob.
2. Base de datos: corre `mongodb-schema.js` en tu cluster con `mongosh`.
3. Instala: `npm install` (en la raíz).
4. Usuario admin: `MONGODB_URI=... npm run seed -- correo@tu.com tuPassword`.
5. Dev: `npm run dev` → http://localhost:3000

## Deploy en Vercel
- Conecta el repo de GitHub. **Root Directory:** `apps/web`.
- Carga las env vars (`MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SPEI_*`).
- Cada push despliega solo.
- La app móvil se compila aparte con EAS Build (Expo), no en Vercel.

## API (middleware)
| Método | Ruta | Función del diagrama |
|---|---|---|
| GET | `/api/events` | getEvents |
| POST | `/api/events` | createEvent (staff) |
| GET | `/api/events/:id` | detalle |
| POST | `/api/reservations` | generateReservation (público) |
| GET | `/api/orden/:token` | consulta de orden (público) |
| POST | `/api/reservations/:id/approve` | approveReservation + sendTickets |
| POST | `/api/reservations/:id/reject` | rechazar |
| GET | `/api/tickets/:qrToken` | getTicketById (staff) |
| POST | `/api/tickets/:qrToken/scan` | scan / syncEventTickets (staff) |
| POST | `/api/upload` | subir comprobante a Vercel Blob |

## Pendientes para producción (TODO marcados en el código)
- `sendTickets`: generar PNG del QR y enviarlo por correo (Resend) al aprobar.
- Rate-limit + captcha en `/api/reservations`.
- Activar Stripe (Fase 3): webhook → `paymentStatus = aprobado`.
- Login del validador en la app móvil (guardar cookie de sesión).
- Input de mapa real (Google Maps) para capturar lat/lng en el panel.
