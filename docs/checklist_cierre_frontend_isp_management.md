# Checklist de cierre del frontend ISP Management

Fecha: 2026-04-16

Objetivo: cerrar lo que falta en el frontend antes de iniciar backend, con prioridad real de negocio, seguridad, UX y preparacion para contratos de API.

## Estado actual resumido

Ya estan cubiertos:

- Dashboard principal.
- Clientes con ficha 360.
- Planes.
- Pagos y detalle.
- Facturas y detalle.
- Tickets y detalle.
- Visitas y detalle.
- Routers y detalle tecnico.
- Monitoreo.
- Acceso y permisos.
- Auditoria de seguridad.
- Configuracion del sistema.
- Portal de cliente.

Lo que sigue no es "hacer mas pantallas", sino cerrar el producto para que backend pueda arrancar con una base estable.

## 1. Bloqueadores antes de backend

### 1.1 Sacar dependencias de mock

- [ ] Definir modo real y modo mock de forma controlada por entorno.
- [ ] Eliminar el flujo de login mock de produccion en [src/pages/LoginPage.tsx](/C:/Users/User/Documents/GitHub/Corma-Frontend/isp-management-frontend/src/pages/LoginPage.tsx).
- [ ] Alinear el adaptador mock de [src/api/axios.ts](/C:/Users/User/Documents/GitHub/Corma-Frontend/isp-management-frontend/src/api/axios.ts) para que no sea un riesgo accidental en despliegue.
- [ ] Revisar el portal de cliente para que el mock quede solo como soporte local, no como comportamiento principal.
- [ ] Documentar claramente que variable de entorno activa mocks y en que entornos se permite.

### 1.2 Cerrar contratos frontend-backend

- [ ] Definir DTOs por modulo.
- [ ] Definir estados y enums comunes.
- [ ] Definir paginacion, filtros y ordenamiento.
- [ ] Definir permisos por ruta y por accion.
- [ ] Definir formatos de error y respuesta estandar.
- [ ] Definir IDs y relaciones entre cliente, factura, pago, ticket, visita y router.

### 1.3 Seguridad base

- [ ] Revisar expiracion y renovacion de sesion.
- [ ] Revisar proteccion de rutas sensibles.
- [ ] Revisar manejo de tokens en storage.
- [ ] Revisar sanitizacion de contenido rico o notas internas.
- [ ] Revisar superficies que muestran datos sensibles por defecto.

## 2. Pendientes prioritarios de producto

### 2.1 Operacion principal

- [ ] Buscador global unico para clientes, tickets, pagos, facturas y routers.
- [ ] Acciones rapidas globales desde dashboard o shell.
- [ ] Filtros persistentes por usuario.
- [ ] Exportacion consistente en modulos donde aplique.
- [ ] Breadcrumbs y jerarquia visual estable en vistas detalle.

### 2.2 Clientes

- [ ] Segmentar clientes por etiquetas o estados operativos.
- [ ] Importacion masiva con previsualizacion y errores por fila.
- [ ] Exportacion filtrada.
- [ ] Adjuntos y notas internas.
- [ ] Bitacora de cambios por cliente.

### 2.3 Comercial y facturacion

- [ ] Versionado de planes.
- [ ] Conciliacion mas clara en pagos.
- [ ] Pagos parciales.
- [ ] Linea de tiempo en facturas.
- [ ] Resumen de cartera con filtros reales.

### 2.4 Soporte

- [ ] Prioridad y SLA en tickets.
- [ ] Comentarios internos y publicos.
- [ ] Adjuntos en tickets.
- [ ] Vista Kanban opcional.
- [ ] Checklist de visita tecnica.

### 2.5 Red y operaciones

- [ ] Backups de routers con versionado.
- [ ] Alertas por umbral en monitoreo.
- [ ] Historial tecnico mas completo.
- [ ] Zonas y cobertura.
- [ ] Inventario tecnico.

### 2.6 Seguridad y administracion

- [ ] Comparacion y clonacion de roles.
- [ ] Auditoria de seguridad mas completa.
- [ ] Configuracion central por secciones.
- [ ] Centro de actividad global.
- [ ] Centro de notificaciones.

### 2.7 Portal de cliente

- [ ] Estado de cuenta simple y claro.
- [ ] Tickets de cliente con seguimiento.
- [ ] Seguridad de cuenta.
- [ ] Descarga de comprobantes.

## 3. Lo que yo cerraria antes de pasar a backend

### Prioridad alta

- [ ] Eliminar mocks principales.
- [ ] Definir contratos de API.
- [ ] Terminar dashboard operativo.
- [ ] Cerrar ficha 360 de cliente.
- [ ] Cerrar tickets, pagos, facturas y visitas.
- [ ] Cerrar routers y monitoreo basico.
- [ ] Cerrar matriz de permisos.
- [ ] Cerrar auditoria de seguridad.
- [ ] Cerrar configuracion del sistema.
- [ ] Cerrar portal de cliente minimo.

### Prioridad media

- [ ] Busqueda global.
- [ ] Filtros persistentes.
- [ ] Exportaciones.
- [ ] Kanban de tickets.
- [ ] Versionado de planes.
- [ ] Backups de router.
- [ ] Centro de notificaciones.

### Prioridad baja

- [ ] Base de conocimiento.
- [ ] Inventario tecnico.
- [ ] Centro de actividad avanzado.
- [ ] Integraciones extendidas.
- [ ] Zonas y cobertura avanzada.

## 4. Definition of done para decir "frontend listo"

Consideraria que el frontend esta listo para backend cuando cumpla todo esto:

- [ ] Las rutas criticas existen y estan protegidas.
- [ ] Los modulos principales tienen listados, detalle y formularios.
- [ ] Los flujos criticos muestran estados `loading`, `empty` y `error`.
- [ ] La UI se ve consistente en desktop y mobile.
- [ ] No quedan mocks activos en produccion.
- [ ] Los permisos funcionan por ruta y accion.
- [ ] Los errores son entendibles para el usuario.
- [ ] El sistema tiene una base visual moderna y homogena.
- [ ] Los contratos de API estan definidos o al menos bosquejados.

## 5. Orden recomendado de ejecucion

1. Sacar mocks y dejar autenticacion real.
2. Definir contratos de API por modulo.
3. Cerrar dashboard y cliente 360 si queda algo pendiente.
4. Terminar tickets, pagos, facturas y visitas.
5. Terminar routers, monitoreo y configuracion.
6. Cerrar seguridad: roles, permisos y auditoria.
7. Dejar portal de cliente minimo funcional.
8. Pasar a funciones diferenciales.

## 6. Resumen corto

Si quieres empezar backend sin rehacer trabajo, el foco deberia ser:

- autenticacion real,
- contratos API,
- modulos operativos criticos,
- gobierno y seguridad,
- portal de cliente minimo.

Todo lo demas puede entrar despues como mejora incremental.
