# ISP Management API

Backend definitivo del sistema ISP Management construido con NestJS y TypeScript.

## Objetivo

- Servir la API principal del producto.
- Encapsular la integracion con MikroTik RouterOS API.
- Mantener una arquitectura modular y escalable.
- Facilitar pruebas e iteracion dentro de un monorepo mientras el producto madura.

## Stack base

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Redis
- Swagger / OpenAPI
- JWT o sesiones con tokens, segun el flujo final de autenticacion
- BullMQ para tareas asicronas

## Principios

- Separacion por dominios.
- Seguridad por defecto.
- Validacion estricta de entrada.
- Permisos verificados en backend.
- Nada de acceso directo desde frontend a MikroTik.

## Estructura

```text
backend/
  prisma/
  src/
    common/
    config/
    modules/
    app.module.ts
    main.ts
  tests/
```

## Primeros dominios

1. Autenticacion.
2. RBAC.
3. Clientes.
4. Facturacion y pagos.
5. Tickets y visitas.
6. Routers y MikroTik.
7. Monitoreo y reportes.
8. Configuracion del sistema.
9. Portal de cliente.

## Regla de oro

Toda integracion tecnica sensible se implementa en backend, nunca en frontend.

## Webhook de pagos (pasarela)

Para registrar pagos automaticamente cuando la pasarela confirme una transaccion:

- Endpoint: `POST /api/v1/payments/webhooks/provider`
- Header opcional: `x-webhook-secret: <PAYMENTS_WEBHOOK_SECRET>`
- Variables de entorno:
  - `PAYMENTS_WEBHOOK_SECRET` (si se define, el header es obligatorio)

Payload esperado (ejemplo):

```json
{
  "externalTransactionId": "txn_123",
  "provider": "pse",
  "invoiceNumber": "INV-2026-0001",
  "clientId": "clt_123",
  "amount": 109900,
  "paymentMethod": "pse",
  "paymentDate": "2026-04-20T14:35:00.000Z",
  "status": "paid"
}
```

## Automatizacion de facturacion y recordatorios

El backend incluye un ciclo automatico para:

- Generar facturas mensuales (una sola vez por periodo).
- Registrar recordatorios de pago por email en auditoria (D-5, D-2, D0 y vencidas).

Variables:

- `BILLING_AUTOMATION_ENABLED=true`
- `BILLING_AUTOMATION_INTERVAL_MINUTES=60`
- `BILLING_CUT_DAY=5`
- `BILLING_DUE_DAYS=10`
- `CLIENT_PORTAL_BASE_URL=http://localhost:5173/client`
- `NOTIFICATIONS_EMAIL_WEBHOOK_URL=` (opcional, receptor HTTP para correo)
- `NOTIFICATIONS_WHATSAPP_WEBHOOK_URL=` (opcional, receptor HTTP para WhatsApp)
- `NOTIFICATIONS_WEBHOOK_AUTH_HEADER=` (opcional, por ejemplo `Bearer <token>`)

Endpoints operativos:

- `GET /api/v1/billing-automation/status`
- `POST /api/v1/billing-automation/run`

## Provision de acceso al portal de cliente

Cuando se crea o actualiza un cliente con email, el backend intenta aprovisionar automaticamente
un usuario con rol `client` para acceso al portal. Si el email ya pertenece a un usuario interno,
se omite y se deja trazabilidad en auditoria.

Variable recomendada:

- `CLIENT_PORTAL_DEFAULT_PASSWORD=ChangeMe123!`
