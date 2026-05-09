# Paquete de decision para cerrar frontend y arrancar backend

Fecha: 2026-04-16

Objetivo: dejar claro que falta para terminar frontend, como debe integrarse MikroTik y que stack de backend conviene evaluar primero en el monorepo temporal.

## 1. Lo que falta por cerrar en el frontend

### Prioridad critica

- [ ] Sacar mocks de login y dejar autenticacion real.
- [ ] Asegurar que el adaptador mock no pueda activarse por error en produccion.
- [ ] Definir contratos de API por modulo.
- [ ] Cerrar dashboard operativo.
- [ ] Cerrar clientes con ficha 360.
- [ ] Cerrar pagos, facturas, tickets y visitas.
- [ ] Cerrar routers y monitoreo basico.
- [ ] Cerrar permisos y auditoria.
- [ ] Cerrar configuracion del sistema.
- [ ] Dejar portal de cliente minimo funcional.

### Prioridad media

- [ ] Buscador global.
- [ ] Filtros persistentes por usuario.
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

## 2. Regla de integracion con MikroTik

La integracion con MikroTik debe vivir en el backend, nunca en el frontend.

### Flujo correcto

1. Frontend.
2. Backend ISP.
3. Backend ISP se conecta a MikroTik RouterOS API.

### Lo que debe hacer el backend

- Probar conexion con credenciales.
- Consultar estado y salud del router.
- Leer metricas y trafico.
- Ejecutar acciones operativas controladas.
- Gestionar backups y restauraciones.
- Normalizar errores de MikroTik para el frontend.

### Lo que no debe hacer el frontend

- No debe tener credenciales de MikroTik.
- No debe conectarse directo al router.
- No debe conocer detalles del protocolo RouterOS.
- No debe manejar tokens de equipo ni sesiones tecnicas.

### Reglas de seguridad

- Guardar credenciales cifradas.
- Registrar solo eventos utiles, nunca secretos.
- Validar permisos por accion.
- Limitar acciones peligrosas.
- Usar colas o jobs para tareas largas o repetibles.

### Contratos sugeridos para MikroTik

- `POST /api/v1/routers/test-connection`
- `POST /api/v1/routers/{id}/test-connection`
- `GET /api/v1/routers/{id}/health`
- `GET /api/v1/routers/{id}/metrics`
- `GET /api/v1/routers/{id}/interfaces`
- `GET /api/v1/routers/{id}/backups`
- `POST /api/v1/routers/{id}/backups`
- `POST /api/v1/routers/{id}/reboot` solo si se define y se protege

### Recomendacion funcional

La primera etapa solo deberia incluir:

- test de conexion,
- health,
- metricas basicas,
- interfaces,
- backups listados.

Las acciones destructivas como reinicio o cambios de configuracion deben quedar para una fase posterior y con autorizacion fuerte.

## 3. Stack de backend recomendado para evaluar primero

### Opcion recomendada

**Laravel 11 + PHP 8.3**

Por que encaja bien:

- Ya tienes contratos y backlog escritos con enfoque Laravel.
- Es muy fuerte para APIs REST.
- Tiene buen soporte para autenticacion, colas, scheduling y eventos.
- Facilita separar dominios por modulos.
- La integracion con MikroTik se puede encapsular en servicios claros.

### Complementos recomendados

- MySQL o MariaDB para datos transaccionales.
- Redis para colas, cache y throttling.
- Sanctum para autenticacion de SPA y portal de cliente.
- Spatie Permission para RBAC.
- Queues para jobs de sincronizacion y monitoreo.
- Scheduler para tareas periodicas.

### Alternativas validas

#### NestJS + TypeScript

Buena opcion si quieres todo en TypeScript y una arquitectura muy estricta.

Ventajas:

- Tipado end-to-end.
- Arquitectura modular.
- Buen encaje con servicios y eventos.

Riesgo:

- Es mas trabajo de definicion inicial si el equipo no domina Nest.

#### FastAPI + Python

Buena opcion si el enfoque fuerte sera integracion tecnica y automatizacion.

Ventajas:

- Rapido para APIs.
- Muy bueno para servicios auxiliares.

Riesgo:

- Para un ERP/ISP completo, puede requerir mas convencion de arquitectura que Laravel.

### Mi recomendacion practica

Si el objetivo es terminar rapido, con buena claridad y sin pelearse con el monorepo:

1. Laravel 11 para el backend principal.
2. MySQL + Redis.
3. Sanctum + Spatie Permission.
4. Servicio MikroTik encapsulado en infraestructura propia.

## 4. Orden de arranque sugerido

1. Cerrar frontend critico.
2. Definir contratos API finales.
3. Arrancar autenticacion y RBAC en backend.
4. Montar dominio de routers con MikroTik.
5. Montar clientes, planes, pagos, facturas, tickets y visitas.
6. Montar monitoreo, reportes y sistema.
7. Separar backend a repositorio propio cuando los contratos ya esten estables.

## 5. Decision breve

Si quieres avanzar sin rehacer nada:

- termina frontend critico,
- usa el monorepo temporal para backend,
- integra MikroTik desde backend,
- evalua primero Laravel 11 como stack base.

