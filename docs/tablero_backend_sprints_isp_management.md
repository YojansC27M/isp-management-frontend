# Tablero de ejecucion backend por sprints (ISP Management)

Fecha: 2026-04-16
Objetivo: ejecutar backend v1 por orden con control de calidad, seguridad y entregables verificables por semana.

Estado de seguimiento:
- Fecha de corte: 2026-04-16.
- Convencion: `[x]` completado en codigo, `[ ]` pendiente.

## 1. Reglas de uso del tablero

- cada sprint debe cerrar con demo funcional y evidencia de pruebas.
- no abrir nuevo sprint sin cerrar riesgos criticos del sprint actual.
- cada historia debe mapear a endpoints del contrato `docs/backend_api_contracts_v1.md`.
- toda historia sensible debe incluir seguridad, auditoria y permisos.

## 2. Sprint 0 (plataforma base)

Duracion sugerida:
- 5 dias habiles.

Entregables:
- estructura inicial en `backend/`.
- configuracion por entorno (`local`, `staging`, `prod`).
- middleware global de errores y correlacion (`request-id`).
- health checks (`/health/live`, `/health/ready`).
- pipeline base de pruebas + lint.

Historias:
- como equipo backend, necesitamos iniciar la aplicacion con settings por entorno para evitar configuracion manual insegura.
- como frontend, necesitamos endpoints de health para validar disponibilidad.
- como soporte tecnico, necesitamos logs estructurados para diagnosticar fallas rapido.

Pruebas minimas:
- test de health endpoints.
- test de serializacion de errores estandar.
- test de carga de variables de entorno obligatorias.

Criterio de cierre:
- app inicia en local sin valores hardcode.
- errores retornan `{ message, code, details }`.
- pipeline corre exitosamente en CI.

Estado actual:
- [x] estructura base en `backend/`.
- [x] validacion de entorno y configuracion por entorno.
- [x] health checks `GET /health/live` y `GET /health/ready`.
- [x] middleware `x-request-id`.
- [x] filtro global de errores con payload estandar y `requestId`.
- [x] pruebas base (`health` y filtro de errores).

## 3. Sprint 1 (auth + rbac)

Duracion sugerida:
- 7 dias habiles.

Entregables:
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- `GET /auth/navigation`.
- endpoints RBAC base del contrato.
- rate limiting en login y auditoria de accesos.

Historias:
- como usuario interno, quiero iniciar sesion para acceder a mis modulos.
- como admin, quiero permisos por rol para controlar operaciones criticas.
- como auditor, quiero registrar eventos de acceso exitoso/fallido.

Pruebas minimas:
- login valido/invalido.
- expiracion/revocacion de sesion.
- acceso denegado por permiso faltante.
- prueba de throttling en login.

Criterio de cierre:
- frontend login puede autenticarse sin mock.
- permisos backend bloquean acciones no autorizadas.
- eventos de seguridad quedan auditados.

Estado actual:
- [x] `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- [x] `GET /auth/navigation`.
- [x] `POST /auth/logout-all`.
- [x] revocacion de token por `jti`.
- [x] corte global de sesiones por usuario (`logout-all` + `iat`).
- [x] auditoria de `login_failed`, `login_succeeded`, `logout`, `token_revoked`, `logout_all`.
- [x] endpoints RBAC base en `security`.
- [x] pruebas unitarias/integracion especificas para `security.service`.
- [x] validacion end-to-end de login frontend sin fallback mock (`npm run test:auth:e2e`).

## 4. Sprint 2 (core operativo)

Duracion sugerida:
- 8 dias habiles.

Entregables:
- CRUD de clientes.
- CRUD de planes.
- CRUD de usuarios internos.
- CRUD de routers inventario.
- filtros, paginacion y sort en listados.

Historias:
- como operador, quiero crear y editar clientes para mantener inventario comercial.
- como administrador, quiero manejar planes y usuarios internos con control de permisos.
- como NOC, quiero registrar routers con datos basicos.

Pruebas minimas:
- validaciones de campos obligatorios por entidad.
- filtros combinados en listados.
- validacion de permisos `read/write` por modulo.

Criterio de cierre:
- frontend de modulos core funciona contra backend real.
- no hay inconsistencia de IDs entre entidades relacionadas.

Estado actual:
- [x] CRUD clientes.
- [x] CRUD routers inventario + prueba de conexion + health.
- [x] CRUD planes.
- [x] CRUD usuarios internos.
- [x] filtros/paginacion/sort consistentes en listados core (`clients`, `plans`, `internal-users`, `routers`).

## 5. Sprint 3 (flujo comercial)

Duracion sugerida:
- 8 dias habiles.

Entregables:
- facturas (`/invoices`, `/invoices/{id}`, `/invoices/{id}/pdf`, `/invoices/generate`).
- pagos (`/payments`, `/payments/{id}`, `/payments/account-status/{clientId}`).
- reglas de consistencia factura-pago-estado de cuenta.

Historias:
- como facturacion, quiero generar facturas para ciclo de cobro.
- como caja, quiero registrar pagos con trazabilidad.
- como admin, quiero ver estado de cuenta por cliente.

Pruebas minimas:
- pago parcial/completo y validaciones de monto.
- generacion de factura idempotente.
- cuenta por cliente consistente despues de pago.

Criterio de cierre:
- frontend pagos/facturas opera sin fallback mock.
- operaciones financieras quedan auditadas.

Estado actual:
- [x] pagos: `GET /payments`, `GET /payments/:id`, `POST /payments`, `GET /payments/account-status/:clientId`.
- [x] facturas: `GET /invoices`, `GET /invoices/:id`.
- [x] pagos: `PUT /payments/:id`, `DELETE /payments/:id`.
- [x] facturas: `POST /invoices`, `GET /invoices/:id/pdf`, `POST /invoices/:id/send`, `POST /invoices/generate`.
- [x] reglas avanzadas de consistencia financiera (reconciliacion estado factura por pagos + generacion idempotente mensual).
- [x] auditoria financiera especifica por operacion en pagos/facturas write.

## 6. Sprint 4 (soporte y campo)

Duracion sugerida:
- 8 dias habiles.

Entregables:
- tickets (`GET/POST/GET by id/PUT/DELETE`).
- comentarios (`POST /tickets/{id}/comments`).
- visitas (`GET/POST/GET by id/PUT/DELETE`, `POST /visits/{id}/reschedule`).

Historias:
- como soporte, quiero crear y actualizar tickets para gestionar incidentes.
- como tecnico, quiero visitas planificadas y reprogramables.
- como supervisor, quiero historial de actividad por ticket.

Pruebas minimas:
- transiciones validas/invalidas de estado.
- visibilidad de comentario interno vs publico.
- reglas de reasignacion y permisos de cierre.

Criterio de cierre:
- flujo ticket -> visita -> cierre funciona sin inconsistencias.
- historial queda trazado en auditoria.

Estado actual:
- [x] tickets: `GET`, `GET by id`, `POST`, `PUT`.
- [x] comentarios de ticket: `GET /tickets/:id/comments`, `POST /tickets/:id/comments`.
- [x] visitas: `GET`, `GET by id`, `POST`, `PUT`.
- [x] tickets: `DELETE /tickets/:id`.
- [x] visitas: `DELETE /visits/:id`, `POST /visits/:id/reschedule`.
- [x] auditoria explicita de cambios de soporte/campo.

## 7. Sprint 5 (routers + monitoring)

Duracion sugerida:
- 8 dias habiles.

Entregables:
- `/routers/test-connection`.
- `/routers/{id}/test-connection`.
- `/routers/{id}/health`.
- `/monitoring/routers/{routerId}/metrics`.
- `/monitoring/routers/{routerId}/interfaces`.
- adaptador de proveedor MikroTik desacoplado.

Historias:
- como NOC, quiero validar conexion de routers sin exponer credenciales.
- como operaciones, quiero ver salud y metricas por router.
- como seguridad, quiero controlar permisos en acciones tecnicas.

Pruebas minimas:
- normalizacion de errores del proveedor.
- ocultamiento de secretos en logs y responses.
- degradacion controlada si el proveedor no responde.

Criterio de cierre:
- frontend routers/monitoring estable con backend real.
- no existen credenciales en respuestas ni logs.

Estado actual:
- [x] `/routers/test-connection`.
- [x] `/routers/{id}/test-connection`.
- [x] `/routers/{id}/health`.
- [x] `/monitoring/routers`.
- [x] `/monitoring/routers/{routerId}/metrics`.
- [x] `/monitoring/routers/{routerId}/interfaces`.
- [x] adaptador MikroTik aislado en modulo de infraestructura.
- [x] pruebas de degradacion controlada cuando proveedor no responde.

## 8. Sprint 6 (gobierno y sistema)

Duracion sugerida:
- 7 dias habiles.

Entregables:
- `GET/PUT /system-settings`, `POST /system-settings/logo`.
- endpoints faltantes de seguridad/roles.
- auditoria consultable con filtros.

Historias:
- como admin, quiero configurar datos globales del sistema.
- como compliance, quiero consultar auditoria por actor/modulo/fecha.

Pruebas minimas:
- permisos admin sobre settings.
- upload validado (tipo y tamano de archivo).
- consultas de auditoria con filtros y paginacion.

Criterio de cierre:
- cambios de sistema son trazables y reversibles.
- accesos no autorizados se bloquean correctamente.

Estado actual:
- [x] `GET /settings/system`.
- [x] `PUT /settings/system`.
- [x] `POST /settings/system/logo`.
- [x] endpoints RBAC y auditoria en `security`.
- [x] filtros avanzados de auditoria (actor/modulo/fecha).
- [x] exportacion de auditoria.

## 9. Sprint 7 (portal cliente + reportes)

Duracion sugerida:
- 8 dias habiles.

Entregables:
- portal cliente (`/client-portal/login`, `/profile`, `/invoices`, `/payments`, `/tickets`).
- reportes (`/reports/summary`, `/reports/revenue`, `/reports/status`, `/reports/overdue-clients`).

Historias:
- como cliente, quiero consultar mi informacion sin ver datos internos.
- como gerente, quiero reportes para decisiones operativas.

Pruebas minimas:
- aislamiento de tenant/contexto cliente.
- validacion de autorizacion por perfil de cliente.
- consistencia de agregados de reportes.

Criterio de cierre:
- portal cliente cumple principio de minimo privilegio.
- reportes responden filtros de fecha y estado sin romper rendimiento base.

Estado actual:
- [x] portal cliente: `POST /client-portal/login`, `GET /profile`, `GET /invoices`, `GET /payments`, `GET /tickets`.
- [x] reportes: `GET /reports/summary`, `GET /reports/metrics`, `GET /reports/revenue`, `GET /reports/status`, `GET /reports/overdue`, `GET /reports/overdue-clients`.
- [x] endurecer aislamiento multi-tenant real (sin fallback por email; requiere rol `client` + match exacto).
- [x] pruebas de autorizacion especificas para portal cliente (unitarias de login/aislamiento).

## 10. Definicion de listo por historia (DoR)

Una historia puede entrar al sprint solo si:

- [ ] endpoint objetivo y contrato estan claros.
- [ ] permisos requeridos estan definidos.
- [ ] reglas de negocio y errores esperados estan documentados.
- [ ] criterio de prueba esta definido.

## 11. Definicion de hecho por historia (DoD)

Una historia se cierra solo si:

- [ ] implementacion completa.
- [ ] pruebas minimas pasando.
- [ ] validaciones y permisos aplicados.
- [ ] auditoria/logs implementados cuando corresponde.
- [ ] documentacion de request/response actualizada.

## 12. Riesgos y mitigacion

- riesgo: mover rapido sin contratos cerrados.
- mitigacion: bloquear merge de endpoints fuera de contrato.

- riesgo: seguridad incompleta al inicio.
- mitigacion: sprint 1 obligatorio antes de modulos de negocio.

- riesgo: acoplar MikroTik al dominio.
- mitigacion: adaptador aislado y interfaz de proveedor.

- riesgo: drift entre frontend y backend.
- mitigacion: smoke tests de integracion por modulo en cada sprint.

## 13. Meta de release v1

Backend v1 listo cuando:

- auth + rbac estables.
- modulos core/comercial/soporte/routers/monitoring en backend real.
- auditoria y configuracion del sistema cerradas.
- portal cliente minimo operativo.
- cobertura minima de pruebas por modulo cumplida.

Estado global actual:
- [x] auth + rbac base.
- [x] routers + monitoring.
- [x] settings + reportes + portal cliente base.
- [x] core operativo completo.
- [x] flujo comercial completo.
- [x] soporte/campo completo.
- [ ] pruebas por modulo aun parciales (hoy cubren health/error/auth/security/monitoring/portal).
