# Modulo Perfiles y Permisos (RBAC)

## Objetivo
Definir un contrato simple para conectar el frontend con backend en el modulo de perfiles y permisos.

## Entidades

### Role
```json
{
  "id": "staff",
  "name": "Staff",
  "description": "Perfil operativo general",
  "isSystem": true
}
```

### Permission
```json
{
  "key": "clients.write",
  "module": "Clientes",
  "label": "Gestionar clientes",
  "description": "Puede crear, editar, eliminar e importar clientes."
}
```

### RolePermissionSet
```json
{
  "roleId": "staff",
  "permissions": [
    "clients.read",
    "clients.write",
    "tickets.read"
  ],
  "updatedAt": "2026-04-09T19:22:00.000Z",
  "updatedBy": "user-12"
}
```

## Endpoints sugeridos

### 1) Catalogo de permisos
- `GET /v1/security/permissions`
- Response: `Permission[]`

### 2) Listado de perfiles
- `GET /v1/security/roles`
- Response: `Role[]`

### 3) Obtener permisos de un perfil
- `GET /v1/security/roles/{roleId}/permissions`
- Response: `RolePermissionSet`

### 4) Actualizar permisos de un perfil
- `PUT /v1/security/roles/{roleId}/permissions`
- Body:
```json
{
  "permissions": [
    "clients.read",
    "clients.write",
    "reports.read"
  ]
}
```
- Response: `RolePermissionSet`

### 5) Restaurar permisos base de un perfil
- `POST /v1/security/roles/{roleId}/permissions/reset`
- Response: `RolePermissionSet`

### 6) Restaurar todos los perfiles a valores base
- `POST /v1/security/roles/permissions/reset-all`
- Response:
```json
{
  "ok": true
}
```

### 7) Historial de cambios de permisos (opcional)
- `GET /v1/security/roles/permissions/audit?limit=50`
- Response:
```json
[
  {
    "id": "audit-1",
    "createdAt": "2026-04-09T19:22:00.000Z",
    "actorId": "user-12",
    "actorName": "Ana Torres",
    "targetRole": "staff",
    "action": "save",
    "details": "Se actualizaron 3 permisos."
  }
]
```

## Reglas recomendadas

- Un perfil con permiso de lectura de modulo y sin escritura:
  - puede ver modulo
  - ve botones de accion deshabilitados
- Sin permiso de lectura:
  - no aparece modulo en menu
  - acceso directo por URL debe devolver `403`
- El backend siempre valida permisos (no confiar solo en UI).

## Carga en login

1. Usuario inicia sesion.
2. Backend retorna `roleId` y opcionalmente `permissions`.
3. Si no retorna `permissions`, frontend consulta `GET /v1/security/roles/{roleId}/permissions`.
4. Frontend guarda permisos en store y aplica controles de rutas/acciones.

