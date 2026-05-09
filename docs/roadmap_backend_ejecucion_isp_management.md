# Roadmap de ejecucion backend ISP Management (orden recomendado)

Fecha: 2026-04-16
Objetivo: construir el backend por orden, con enfoque profesional, seguridad by default y minimo retrabajo con el frontend.

## 1. Principios no negociables

- Seguridad primero: autenticacion, autorizacion, validacion y auditoria desde el inicio.
- Contratos estables: no implementar endpoints fuera del contrato de `docs/backend_api_contracts_v1.md`.
- Dominio por modulos: separar casos de uso por contexto (clientes, tickets, routers, etc.).
- Observabilidad real: logs estructurados, trazabilidad por request y errores consistentes.
- Calidad incremental: cada modulo sale con pruebas minimas y criterios de cierre.

## 2. Orden de ejecucion (fases)

### Fase 0. Plataforma base (semana 1)

Objetivo:
- dejar lista la base tecnica segura para que todo lo demas se construya encima sin deuda grave.

Implementar:
- bootstrap del backend en `backend/`.
- configuracion por entorno (`local`, `staging`, `prod`).
- manejo de errores estandar (`message`, `code`, `details`).
- validacion global de request DTO.
- logging estructurado con request-id.
- health checks (`/health/live`, `/health/ready`).
- migraciones iniciales y convenciones de base de datos.

Definition of done:
- `GET /health/live` y `GET /health/ready` responden estable.
- existe pipeline basico de tests.
- cualquier error del sistema retorna formato estandar.

### Fase 1. Seguridad y acceso (semana 1-2)

Objetivo:
- cerrar identidad y permisos para no rehacer seguridad al final.

Implementar:
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- `GET /auth/navigation` alineado a `docs/navigation-ids.md`.
- RBAC backend alineado a `docs/rbac-backend-contract.md`.
- tabla de sesiones/tokens y expiracion.
- rate limit para login y endpoints sensibles.
- auditoria de eventos: login exitoso/fallido, cambio de permisos.

Definition of done:
- frontend puede autenticarse contra backend real.
- permisos se validan en backend por endpoint (no solo en frontend).
- intentos fallidos quedan auditados.

### Fase 2. Core operativo (semana 2-3)

Objetivo:
- habilitar la operacion principal del ISP para data maestra.

Implementar:
- clientes (`GET/POST/GET by id/PUT/DELETE`).
- planes (`GET/POST/GET by id/PUT/DELETE`).
- usuarios internos y roles operativos.
- routers inventario base.
- paginacion, filtros y sort consistentes en listados.

Definition of done:
- CRUD completos con validacion de negocio.
- errores funcionales devuelven `code` semantico.
- permisos `read/write` aplicados correctamente.

### Fase 3. Flujo comercial (semana 3-4)

Objetivo:
- habilitar ingresos, cartera y trazabilidad financiera.

Implementar:
- facturas (`/invoices`, `/invoices/{id}`, `/invoices/{id}/pdf`, `/invoices/generate`).
- pagos (`/payments`, `/payments/{id}`, `/payments/account-status/{clientId}`).
- validaciones de consistencia (monto, estado, relacion factura-cliente).
- eventos de auditoria financiera (creacion/edicion/anulacion logica).

Definition of done:
- frontend de pagos/facturas opera sin mocks.
- estado de cuenta por cliente responde en tiempo razonable.
- no hay operaciones que rompan integridad referencial.

### Fase 4. Soporte y campo (semana 4-5)

Objetivo:
- cerrar ciclo de atencion y ejecucion operativa.

Implementar:
- tickets (`GET/POST/GET by id/PUT/DELETE`).
- comentarios (`POST /tickets/{id}/comments`).
- visitas (`GET/POST/GET by id/PUT/DELETE`, `POST /visits/{id}/reschedule`).
- reglas de asignacion y estados validos.
- separacion entre nota interna y comentario publico.

Definition of done:
- historial de ticket y visita se conserva correctamente.
- transiciones de estado invalidas retornan error de negocio.
- permisos por accion (crear, asignar, comentar, cerrar) verificados.

### Fase 5. Routers + monitoring (semana 5-6)

Objetivo:
- llevar operacion de red a backend real y preparar camino MikroTik.

Implementar:
- `POST /routers/test-connection`.
- `POST /routers/{id}/test-connection`.
- `GET /routers/{id}/health`.
- `GET /monitoring/routers/{routerId}/metrics`.
- `GET /monitoring/routers/{routerId}/interfaces`.
- adaptador de proveedor (MikroTik) aislado en capa de infraestructura.

Definition of done:
- frontend de routers/monitoring deja de depender de mock.
- credenciales de router no se exponen en respuestas.
- errores de proveedor se normalizan al contrato estandar.

### Fase 6. Gobierno y sistema (semana 6-7)

Objetivo:
- consolidar control administrativo y cumplimiento.

Implementar:
- sistema (`GET/PUT /system-settings`, `POST /system-settings/logo`).
- endpoints de seguridad/roles pendientes.
- auditoria consultable con filtros.
- exportaciones base donde aplique.

Definition of done:
- cambios criticos quedan auditados.
- configuracion sensible protegida por permisos admin.
- trazabilidad minima disponible para operacion.

### Fase 7. Portal cliente y reportes (semana 7-8)

Objetivo:
- exponer experiencia segura para cliente final y capa ejecutiva.

Implementar:
- portal cliente (`/client-portal/login`, `/profile`, `/invoices`, `/payments`, `/tickets`).
- reportes (`/reports/summary`, `/reports/revenue`, `/reports/status`, `/reports/overdue-clients`).
- aislamiento estricto de contexto cliente vs interno.

Definition of done:
- portal no expone campos internos.
- reportes responden con filtros y periodos estables.
- permisos y scopes diferenciados entre usuario interno y cliente.

## 3. Checklist de calidad por modulo (obligatorio)

Cada modulo se considera cerrado solo si cumple:

- [ ] contrato API implementado sin desviaciones.
- [ ] validaciones de entrada completas.
- [ ] permisos backend por endpoint.
- [ ] errores funcionales normalizados.
- [ ] logs y eventos de auditoria relevantes.
- [ ] pruebas de servicio + pruebas de endpoint minimas.
- [ ] documentacion de ejemplos request/response actualizada.

## 4. Buenas practicas tecnicas recomendadas

- usar versionado de API desde el inicio (`/api/v1`).
- aplicar migraciones idempotentes y reversibles.
- no usar deletes fisicos en entidades criticas sin politicas claras.
- manejar secretos via entorno seguro, nunca hardcode.
- incorporar throttling en auth y endpoints costosos.
- usar colas para tareas lentas (PDF, email, sync, backups).
- agregar idempotencia en operaciones sensibles (generar facturas, registrar pagos masivos).

## 5. Seguridad minima de produccion

- autenticacion con expiracion y revocacion.
- RBAC aplicado en backend.
- sanitizacion de entradas de texto libre.
- validacion de adjuntos por tipo/tamano.
- cifrado de credenciales sensibles (especialmente routers).
- auditoria de accesos y cambios administrativos.
- CORS y headers de seguridad definidos por entorno.

## 6. Siguiente paso exacto (hoy)

1. cerrar Fase 0 completa.
2. arrancar Fase 1 (`auth` + `rbac`) y conectar login del frontend.
3. apagar mock login en entorno no local cuando Fase 1 pase pruebas.

## 7. Meta de cierre backend v1

El backend v1 queda "listo para operar" cuando:

- auth + rbac estan estables.
- modulos core/comercial/soporte/routers/monitoring funcionan sin mocks.
- auditoria y configuracion del sistema estan activas.
- portal cliente minimo funciona con aislamiento de datos.
- contratos v1 se cumplen y estan documentados.

## 8. Tablero semanal de ejecucion

Para ejecutar este roadmap sprint por sprint, usa:

- `docs/tablero_backend_sprints_isp_management.md`
