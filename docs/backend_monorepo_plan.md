# Plan de monorepo temporal para backend

Fecha: 2026-04-16

Objetivo: preparar este repositorio para contener frontend y backend en paralelo mientras se validan flujos, contratos y permisos. Cuando el backend madure, se podra separar a otro repo sin rehacer el diseño funcional.

## Enfoque

Durante esta etapa:

- El frontend permanece como cliente principal.
- El backend vive dentro del mismo repositorio, bajo una carpeta dedicada.
- Los contratos de API se definen antes de implementar logica compleja.
- Los mocks se usan solo como soporte local de desarrollo.
- La separacion futura debe ser simple: codigo desacoplado, contratos estables y dominios claros.

## Estructura recomendada del monorepo

```text
/
  src/                      # Frontend actual
  backend/                  # Backend temporal
  docs/                     # Contratos y decisiones
  public/
  package.json              # Frontend actual
```

Dentro de `backend/`:

```text
backend/
  app/
  bootstrap/
  config/
  database/
  routes/
  tests/
  storage/
  .env.example
  README.md
```

## Reglas de convivencia

- El backend no debe depender de componentes del frontend.
- Los DTOs y enums deben documentarse en `docs/` para ambos lados.
- Los nombres de rutas deben alinearse con el contrato de frontend.
- Los permisos deben validarse en backend aunque la UI ya los oculte.
- La carpeta `backend/` debe poder migrarse luego a un repositorio propio sin cambiar el contrato funcional.

## Prioridad de trabajo

### Fase A. Contratos base

- Autenticacion.
- RBAC.
- Clientes.
- Planes.
- Pagos.
- Facturas.
- Tickets.
- Visitas.
- Routers.
- Monitoreo.
- Configuracion del sistema.
- Auditoria.

### Fase B. Servicios operativos

- Reportes.
- Portal de cliente.
- Notificaciones.
- Exportaciones.
- Historiales.

### Fase C. Refinamiento

- Tareas async.
- Reintentos.
- Webhooks.
- Integraciones.
- Cache y optimizacion.

## Criterio para separar a otro repo

La separacion sera segura cuando:

- Los contratos esten cerrados.
- El frontend apunte a APIs estables.
- El backend tenga pruebas basicas.
- No existan dependencias circulares entre dominios.
- La configuracion por entorno este documentada.

## Decision tecnica recomendada

Para evitar rehacer trabajo:

- Mantener los nombres de recursos ya usados por el frontend.
- Documentar primero los contratos en `docs/rbac-backend-contract.md`, `docs/navigation-ids.md` y este plan.
- Implementar backend con estructura modular por dominio.
- Separar logica de aplicacion, infraestructura y presentacion desde el inicio.

## Siguiente paso sugerido

Crear el esqueleto inicial del backend temporal y, en paralelo, el contrato de API por modulo para empezar a implementar sin dudas de alcance.
