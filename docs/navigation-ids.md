# Navigation IDs Contract

Este frontend usa IDs como fuente de verdad para módulos/submódulos.
El backend debe responder IDs válidos en `GET /auth/navigation`.

## Módulos

- `dashboard`
- `internal-users`
- `clients`
- `commercial`
- `support`
- `operations`
- `security`

## Submódulos por módulo

- `clients`:
  - `clients-list`
  - `clients-map`
- `commercial`:
  - `plans`
  - `payments`
  - `invoices`
- `support`:
  - `tickets`
  - `visits`
- `operations`:
  - `routers`
  - `monitoring`
  - `reports`
- `security`:
  - `settings-system`
  - `access-control`
  - `security-audit`

## Payload esperado

```json
{
  "modules": [
    { "id": "dashboard" },
    { "id": "clients", "items": ["clients-list", "clients-map"] },
    { "id": "security", "items": ["access-control"] }
  ]
}
```

## Notas de seguridad

- El frontend ignora IDs no permitidos (whitelist).
- El backend debe seguir validando permisos por endpoint (no confiar en el menú).
