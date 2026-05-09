# Backlog frontend expandido ISP Management

Fecha: 2026-04-16
Objetivo: definir el alcance final recomendado del frontend antes de iniciar el backend, con enfoque en operacion real, UX moderna, seguridad y mantenibilidad.

## Criterios generales

Cada historia de este backlog debe cumplir, como minimo:

- UI consistente con el sistema visual existente.
- Validacion de formularios en frontend.
- Manejo de estados `loading`, `empty` y `error`.
- Control de permisos por ruta y por accion.
- Responsive en desktop y mobile.
- Acciones criticas con confirmacion.
- Trazabilidad basica de cambios cuando aplique.

---

## Epic 1. Shell de producto y experiencia transversal

### FEA-01 - Busqueda global unificada
Tipo: Frontend
Prioridad: Alta

Descripcion:
Un buscador global que permita encontrar rapidamente clientes, tickets, pagos, facturas y routers desde una sola entrada.

Criterios de aceptacion:

- La busqueda permite filtrar por tipo de entidad.
- Los resultados muestran informacion clave y acceso directo.
- El comportamiento es rapido y accesible desde desktop.
- El modulo respeta permisos del usuario.

### FEA-02 - Estados estandarizados de pantalla
Tipo: Frontend
Prioridad: Alta

Descripcion:
Estandarizar los estados visuales de carga, vacio, error y exito para listas, formularios y vistas detalle.

Criterios de aceptacion:

- Todos los modulos usan el mismo lenguaje visual para estados.
- Los errores muestran una accion sugerida.
- Los vacios incluyen CTA util cuando aplique.

### FEA-03 - Acciones rapidas globales
Tipo: Frontend
Prioridad: Media

Descripcion:
Agregar accesos rapidos para crear cliente, ticket, pago y visita desde el dashboard o desde la shell.

Criterios de aceptacion:

- Las acciones cambian segun permisos.
- Cada accion abre el flujo correcto sin friccion.
- La experiencia es util en desktop y mobile.

### FEA-04 - Filtros persistentes por usuario
Tipo: Frontend
Prioridad: Media

Descripcion:
Permitir que los filtros de listas y reportes se conserven por usuario.

Criterios de aceptacion:

- Los filtros sobreviven al recargar la pagina.
- El usuario puede limpiar los filtros facilmente.
- La persistencia no interfiere con otros modulos.

---

## Epic 2. Dashboard operacional

### FEA-05 - Dashboard con KPIs reales
Tipo: Frontend
Prioridad: Alta

Descripcion:
Convertir el dashboard en un centro de operacion con indicadores de clientes, ingresos, tickets, routers online y morosidad.

Criterios de aceptacion:

- Los KPI se agrupan por contexto operativo.
- Cada tarjeta permite profundizar al modulo correspondiente.
- Los datos se actualizan sin romper la experiencia.

### FEA-06 - Alertas y actividad reciente
Tipo: Frontend
Prioridad: Alta

Descripcion:
Incluir alertas criticas y actividad reciente para que el usuario detecte rapidamente problemas o eventos importantes.

Criterios de aceptacion:

- Se distinguen alertas criticas, informativas y de seguimiento.
- La actividad muestra usuario, modulo, accion y fecha.
- Los elementos relevantes tienen enlace al detalle.

---

## Epic 3. Clientes

### FEA-07 - Ficha 360 del cliente
Tipo: Fullstack frontend-first
Prioridad: Alta

Descripcion:
Unificar en una sola vista los datos del cliente, su servicio, estado de cuenta, tickets, visitas, notas e historial de cambios.

Criterios de aceptacion:

- La vista muestra resumen ejecutivo y secciones detalladas.
- El usuario puede navegar a tickets, pagos, facturas y visitas del cliente.
- Se separa claramente la informacion publica y la interna.

### FEA-08 - Segmentacion y etiquetas de cliente
Tipo: Frontend
Prioridad: Media

Descripcion:
Permitir clasificar clientes por etiquetas como residencial, empresarial, suspendido, moroso o nuevo.

Criterios de aceptacion:

- Las etiquetas son visibles en listas y detalle.
- Se pueden filtrar clientes por segmento.
- El sistema admite mas de una etiqueta por cliente.

### FEA-09 - Importacion y exportacion de clientes
Tipo: Frontend
Prioridad: Media

Descripcion:
Agregar flujo para carga masiva desde CSV y exportacion de listados filtrados.

Criterios de aceptacion:

- El usuario puede previsualizar los datos antes de importar.
- Los errores de filas invalidas se reportan claramente.
- La exportacion respeta filtros y permisos.

### FEA-10 - Adjuntos y notas internas del cliente
Tipo: Frontend
Prioridad: Media

Descripcion:
Permitir adjuntar documentos y registrar notas internas en la ficha del cliente.

Criterios de aceptacion:

- Los adjuntos muestran nombre, tipo y fecha.
- Las notas internas quedan separadas del contenido visible al cliente.
- Las acciones criticas requieren confirmacion o validacion.

---

## Epic 4. Comercial y facturacion

### FEA-11 - Versionado de planes
Tipo: Frontend
Prioridad: Alta

Descripcion:
Incorporar versionado de planes para evitar romper contratos vigentes cuando cambian precios o velocidades.

Criterios de aceptacion:

- El usuario puede ver historial de cambios del plan.
- Se distinguen versiones activas e historicas.
- El cambio de plan muestra impacto antes de confirmar.

### FEA-12 - Vista de pagos con conciliacion
Tipo: Frontend
Prioridad: Alta

Descripcion:
Mejorar pagos con conciliacion de facturas, filtros avanzados y trazabilidad por cliente.

Criterios de aceptacion:

- Un pago puede relacionarse claramente con una o mas facturas segun el modelo definido.
- El listado permite filtrar por estado, metodo y rango de fechas.
- El detalle muestra usuario que registro el pago.

### FEA-13 - Facturas con linea de tiempo
Tipo: Frontend
Prioridad: Alta

Descripcion:
Hacer que el detalle de factura muestre estados, eventos y acciones disponibles como descarga, reintento de envio y seguimiento.

Criterios de aceptacion:

- La factura muestra su estado actual y su historial.
- El usuario puede descargar el PDF si tiene permisos.
- Los errores de envio o generacion se presentan de forma clara.

### FEA-14 - Resumen de cartera
Tipo: Frontend
Prioridad: Media

Descripcion:
Agregar una vista de cartera con morosidad, proximos vencimientos, estado por cliente y alertas de cobro.

Criterios de aceptacion:

- La vista permite filtrar por zona, plan y rango de vencimiento.
- Los clientes en riesgo se resaltan visualmente.
- El usuario puede navegar al detalle desde la misma pantalla.

---

## Epic 5. Soporte y visitas

### FEA-15 - Tickets con prioridad y SLA
Tipo: Fullstack frontend-first
Prioridad: Alta

Descripcion:
Extender tickets para incluir prioridad, SLA, categoria, asignacion y seguimiento por estado.

Criterios de aceptacion:

- El ticket muestra prioridad y fecha compromiso.
- El listado permite priorizar visualmente los casos urgentes.
- El flujo soporta comentarios internos y publicos.

### FEA-16 - Kanban o vista operativa de tickets
Tipo: Frontend
Prioridad: Media

Descripcion:
Agregar una vista operativa opcional para tickets por estado, sin reemplazar la tabla tradicional.

Criterios de aceptacion:

- El usuario puede alternar entre tabla y tablero.
- El cambio de estado se entiende con claridad.
- La vista respeta permisos y filtros.

### FEA-17 - Visitas tecnicas con checklist
Tipo: Fullstack frontend-first
Prioridad: Alta

Descripcion:
Mejorar el calendario de visitas con estados operativos, tecnico asignado, checklist y evidencia.

Criterios de aceptacion:

- La visita muestra estado, tecnico, fecha y ubicacion.
- El tecnico puede registrar resultado y observaciones.
- Se contemplan reprogramaciones y cancelaciones.

### FEA-18 - Base de conocimiento interna
Tipo: Frontend
Prioridad: Media

Descripcion:
Crear una wiki tecnica interna para procedimientos y solucion de problemas frecuentes.

Criterios de aceptacion:

- Los articulos tienen categorias y busqueda.
- El editor soporta contenido estructurado o markdown.
- La experiencia de lectura es clara y rapida.

---

## Epic 6. Operaciones de red

### FEA-19 - Routers con salud tecnica
Tipo: Fullstack frontend-first
Prioridad: Alta

Descripcion:
Convertir routers en un modulo operativo con conexion, estado, ubicacion, historial y alertas.

Criterios de aceptacion:

- Cada router muestra estado de conexion.
- El detalle incluye CPU, RAM, uptime e interfaces.
- El usuario puede probar conexion desde la UI.

### FEA-20 - Backups y versionado de router
Tipo: Frontend
Prioridad: Media

Descripcion:
Permitir visualizar, descargar y versionar backups de configuracion de routers.

Criterios de aceptacion:

- Cada backup tiene fecha, usuario y estado.
- El historial es facil de consultar.
- La accion de descarga es segura y confirmada.

### FEA-21 - Monitoreo tecnico con alertas
Tipo: Fullstack frontend-first
Prioridad: Alta

Descripcion:
Ampliar el monitoreo con graficas historicas, alertas por umbral y eventos tecnicos.

Criterios de aceptacion:

- Las graficas son claras y comparables en el tiempo.
- Las alertas tienen prioridad visual.
- El usuario puede ir del indicador al router afectado.

### FEA-22 - Zonas y cobertura
Tipo: Frontend
Prioridad: Media

Descripcion:
Agregar una gestion visual de zonas para ventas, soporte y mapa de clientes.

Criterios de aceptacion:

- Las zonas se pueden relacionar con clientes y routers.
- El mapa respeta filtros por zona.
- La informacion clave se entiende rapidamente.

---

## Epic 7. Seguridad y administracion

### FEA-23 - Matriz de permisos editable
Tipo: Frontend
Prioridad: Alta

Descripcion:
Permitir administrar permisos por rol de forma visual y controlada.

Criterios de aceptacion:

- El usuario puede ver permisos por modulo y por accion.
- Los cambios muestran impacto antes de guardar.
- Los perfiles base protegidos no se modifican accidentalmente.

### FEA-24 - Clonacion y comparacion de roles
Tipo: Frontend
Prioridad: Media

Descripcion:
Facilitar la creacion de nuevos roles a partir de otros existentes y comparar diferencias.

Criterios de aceptacion:

- Se puede duplicar un rol como base.
- La comparacion muestra permisos agregados y removidos.
- La accion requiere permisos de administracion.

### FEA-25 - Auditoria de seguridad completa
Tipo: Frontend
Prioridad: Alta

Descripcion:
Mejorar la pantalla de auditoria para ver cambios de acceso, login fallido, modificaciones criticas y eventos por modulo.

Criterios de aceptacion:

- Los filtros por usuario, modulo y fecha funcionan bien.
- Se diferencian eventos informativos, advertencias y criticos.
- La exportacion de eventos es posible con permisos.

### FEA-26 - Configuracion central del sistema
Tipo: Frontend
Prioridad: Alta

Descripcion:
Centralizar datos de empresa, moneda, logo, horarios, parametros de facturacion y plantillas de notificacion.

Criterios de aceptacion:

- La configuracion se organiza por secciones.
- El usuario entiende que cambios son sensibles.
- El modulo esta protegido por permiso de alto nivel.

---

## Epic 8. Portal de cliente

### FEA-27 - Estado de cuenta del cliente
Tipo: Frontend
Prioridad: Alta

Descripcion:
Mostrar al cliente su estado de cuenta, facturas, pagos y proximos vencimientos en una UI simple.

Criterios de aceptacion:

- La informacion es facil de entender.
- El cliente ve solo sus propios datos.
- Los estados y montos se presentan sin ambiguedad.

### FEA-28 - Tickets y seguimiento en portal
Tipo: Frontend
Prioridad: Alta

Descripcion:
Permitir crear y seguir tickets desde el portal del cliente.

Criterios de aceptacion:

- El cliente puede ver el estado del ticket.
- El cliente puede aportar comentarios o adjuntos segun reglas definidas.
- El flujo es mas simple que el del panel interno.

### FEA-29 - Seguridad de cuenta del cliente
Tipo: Frontend
Prioridad: Media

Descripcion:
Agregar cambio de contrasena, verificacion basica de sesion y protecciones de acceso.

Criterios de aceptacion:

- El cliente puede cambiar su contrasena de forma segura.
- Los datos sensibles no quedan expuestos innecesariamente.
- El flujo sigue principios de minima informacion.

---

## Epic 9. Modulos diferenciales

### FEA-30 - Centro de notificaciones
Tipo: Frontend
Prioridad: Media

Descripcion:
Unificar notificaciones de pagos, tickets, visitas, cortes y eventos tecnicos.

Criterios de aceptacion:

- Las notificaciones se agrupan por tipo.
- Se puede marcar lectura o revisar historial.
- El usuario ve solo las notificaciones permitidas por rol.

### FEA-31 - Inventario tecnico
Tipo: Frontend
Prioridad: Baja

Descripcion:
Gestionar equipos instalados o de bodega con serial, ubicacion, estado y relacion con cliente.

Criterios de aceptacion:

- Los equipos pueden asociarse a clientes o routers.
- El listado soporta filtros por tipo y estado.
- La vista detalle muestra historial basico.

### FEA-32 - Centro de actividad
Tipo: Frontend
Prioridad: Baja

Descripcion:
Mostrar una bitacora global de acciones relevantes del sistema para administracion y soporte.

Criterios de aceptacion:

- Se puede filtrar por usuario, modulo y fecha.
- Las acciones criticas quedan visibles.
- La lectura del registro es rapida y clara.

---

## MVP recomendado antes del backend

Si el objetivo es empezar backend con una base solida, este seria el minimo recomendado:

1. Login, logout y RBAC completamente aplicados.
2. Dashboard con KPIs y alertas.
3. CRUD de clientes con ficha detalle.
4. CRUD de planes.
5. Listado y detalle de pagos.
6. Listado y detalle de facturas.
7. Tickets con detalle, comentarios y estados.
8. Visitas con calendario y detalle.
9. Routers con listado y detalle tecnico.
10. Monitoreo basico.
11. Matriz de permisos.
12. Auditoria de seguridad.
13. Configuracion del sistema.
14. Portal de cliente basico.

---

## Siguiente paso sugerido

Convertir este backlog en roadmap por sprint y, a partir de ahi, definir los contratos de API para backend con los mismos IDs de modulos, estados y permisos.
