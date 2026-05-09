# Contratos de API v1 para backend temporal

Fecha: 2026-04-16

Objetivo: definir la primera version de contratos entre frontend y backend para poder implementar y probar en monorepo sin redefinir cada pantalla.

## Convenciones generales

- Base path: `/api/v1`
- Formato: JSON
- Fechas: ISO 8601 UTC
- Errores: objeto estandar con `message`, `code` y `details` opcional
- Paginacion: `page`, `perPage`, `total`
- Orden: `sortBy`, `sortDir`
- Filtros: query params por modulo
- Permisos: validacion obligatoria en backend

## 1. Autenticacion

### POST `/auth/login`

Request:

```json
{
  "email": "admin@isp.com",
  "password": "secret"
}
```

Response:

```json
{
  "token": "jwt-or-sanctum-token",
  "user": {
    "id": "user-1",
    "name": "Ana Torres",
    "email": "admin@isp.com",
    "role": "admin",
    "permissions": ["clients.read", "clients.write"]
  }
}
```

### POST `/auth/logout`

### GET `/auth/me`

### GET `/auth/navigation`

Usa el contrato de `docs/navigation-ids.md`.

## 2. Seguridad / RBAC

Usa el contrato de `docs/rbac-backend-contract.md`.

Endpoints base:

- `GET /security/permissions`
- `GET /security/roles`
- `GET /security/roles/{roleId}/permissions`
- `PUT /security/roles/{roleId}/permissions`
- `POST /security/roles/{roleId}/permissions/reset`
- `POST /security/roles/permissions/reset-all`
- `GET /security/roles/permissions/audit`

## 3. Clientes

- `GET /clients`
- `POST /clients`
- `GET /clients/{id}`
- `PUT /clients/{id}`
- `DELETE /clients/{id}`
- `GET /clients/{id}/summary`
- `GET /clients/{id}/payments`
- `GET /clients/{id}/tickets`
- `GET /clients/{id}/visits`

## 4. Planes

- `GET /plans`
- `POST /plans`
- `GET /plans/{id}`
- `PUT /plans/{id}`
- `DELETE /plans/{id}`
- `GET /plans/{id}/versions`

## 5. Pagos

- `GET /payments`
- `POST /payments`
- `GET /payments/{id}`
- `PUT /payments/{id}`
- `DELETE /payments/{id}`
- `GET /payments/account-status/{clientId}`

## 6. Facturas

- `GET /invoices`
- `POST /invoices`
- `GET /invoices/{id}`
- `GET /invoices/{id}/pdf`
- `POST /invoices/{id}/send`
- `POST /invoices/generate`

## 7. Tickets

- `GET /tickets`
- `POST /tickets`
- `GET /tickets/{id}`
- `PUT /tickets/{id}`
- `DELETE /tickets/{id}`
- `POST /tickets/{id}/comments`
- `POST /tickets/{id}/attachments`

## 8. Visitas

- `GET /visits`
- `POST /visits`
- `GET /visits/{id}`
- `PUT /visits/{id}`
- `DELETE /visits/{id}`
- `POST /visits/{id}/reschedule`

## 9. Routers

- `GET /routers`
- `POST /routers`
- `GET /routers/{id}`
- `PUT /routers/{id}`
- `DELETE /routers/{id}`
- `POST /routers/test-connection`
- `POST /routers/{id}/test-connection`
- `GET /routers/{id}/health`

## 10. Monitoreo

- `GET /monitoring/routers`
- `GET /monitoring/routers/{routerId}/metrics`
- `GET /monitoring/routers/{routerId}/interfaces`

## 11. Reportes

- `GET /reports/summary`
- `GET /reports/revenue`
- `GET /reports/status`
- `GET /reports/overdue-clients`

## 12. Configuracion del sistema

- `GET /system-settings`
- `PUT /system-settings`
- `POST /system-settings/logo`

## 13. Portal de cliente

- `POST /client-portal/login`
- `GET /client-portal/profile`
- `GET /client-portal/invoices`
- `GET /client-portal/payments`
- `GET /client-portal/tickets`

## 14. Respuestas recomendadas

### Error estandar

```json
{
  "message": "No autorizado",
  "code": "UNAUTHORIZED",
  "details": []
}
```

### Lista paginada

```json
{
  "data": [],
  "page": 1,
  "perPage": 20,
  "total": 0
}
```

## 15. Reglas de seguridad

- El backend valida todos los permisos.
- Las rutas sensibles requieren autenticacion.
- Los datos del portal de cliente nunca deben mezclar contexto interno.
- Los adjuntos deben validarse por tipo y tamano.
- Los logs no deben exponer tokens ni credenciales.

## 16. Siguiente paso

Con este contrato ya se puede empezar a construir el backend temporal dentro del monorepo sin perder alineacion con el frontend.
