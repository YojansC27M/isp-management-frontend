# Propuesta de ampliacion del frontend ISP Management

Fecha: 2026-04-16
Objetivo: cerrar el alcance funcional del frontend antes de iniciar el backend, manteniendo buenas practicas, seguridad, claridad visual y una experiencia intuitiva.

## 1. Estado actual del frontend

El frontend ya cubre una base muy solida:

- Autenticacion, rutas protegidas y RBAC.
- Modulos de clientes, planes, pagos, facturas, tickets, visitas, routers, monitoreo y reportes.
- Portal de cliente.
- Configuracion del sistema.
- Auditoria de seguridad y panel de acceso.
- Componentes reutilizables para tablas, filtros, KPIs y paginas.

Con eso, el siguiente paso no es solo "hacer mas pantallas", sino cerrar flujos completos, mejorar consistencia y agregar funciones que hagan al producto util en operacion real.

## 2. Mejoras globales recomendadas para todo el frontend

Estas mejoras aplican a todos los modulos:

1. Buscar globalmente clientes, facturas, tickets, routers y pagos desde un comando o buscador unico.
2. Agregar estados visuales estandar para `loading`, `empty`, `error` y `success` en todas las pantallas.
3. Incluir breadcrumb, acciones rapidas y resumen de contexto en todas las vistas detalle.
4. Estandarizar formularios con:
   - secciones claras,
   - validacion en tiempo real,
   - guardado con confirmacion,
   - mensajes de error accionables.
5. Crear filtros persistentes por usuario para listas largas.
6. Permitir exportacion a CSV, PDF o Excel donde tenga sentido.
7. Agregar historiales y trazabilidad en pantallas criticas.
8. Mejorar UX movil:
   - sidebar colapsable,
   - tablas responsivas,
   - cards apiladas,
   - acciones principales visibles arriba.
9. Reforzar accesibilidad:
   - foco visible,
   - labels reales,
   - contraste correcto,
   - navegacion por teclado.
10. Mantener seguridad de frontend:
    - permisos por ruta y por accion,
    - no confiar en el menu como control de acceso,
    - validacion defensiva de datos,
    - sanitizacion de contenido rico.

## 3. Que agregaria o mejoraria por modulo

### 3.1 Dashboard principal

Agregar:

- KPIs de ingresos, clientes activos, tickets abiertos, routers online y morosidad.
- Acciones rapidas: crear cliente, crear ticket, registrar pago, abrir visita.
- Actividad reciente.
- Alertas operativas.
- Bloques por rol: comercial, soporte, tecnico, admin.

Mejora clave:

- Hacerlo un centro de operaciones real, no solo una pantalla resumen.

### 3.2 Usuarios internos

Agregar:

- Perfil detallado con permisos, ultimo acceso y actividad reciente.
- Estado activo/inactivo.
- Asignacion de zonas, roles secundarios o especialidades.
- Historial de cambios.
- Restablecimiento seguro de credenciales.

Mejora clave:

- Facilitar administracion de personal y trazabilidad.

### 3.3 Clientes

Agregar:

- Ficha 360 del cliente:
  - datos personales,
  - direccion y mapa,
  - plan contratado,
  - estado de cuenta,
  - tickets,
  - visitas,
  - historial de cambios.
- Etiquetas o segmentos: residencial, empresarial, moroso, nuevo, suspendido.
- Importacion y exportacion masiva.
- Adjuntos: documentos, contratos, soportes.
- Comentarios internos.
- Bitacora de cambios.

Mejora clave:

- La ficha del cliente debe ser el centro del sistema.

### 3.4 Mapa de clientes

Agregar:

- Filtros por zona, plan, estado y tecnico.
- Agrupacion por clusters cuando haya muchos puntos.
- Leyenda clara por colores.
- Vista lateral con resumen del cliente seleccionado.
- Deteccion de zonas de cobertura.

Mejora clave:

- Convertir el mapa en una herramienta operativa, no solo visual.

### 3.5 Planes

Agregar:

- Versionado de planes.
- Fecha de vigencia de cambios.
- Comparacion entre planes.
- Reglas de migracion.
- Precio promocional o temporal.
- Estado activo/inactivo.
- Plantillas para queues y perfiles tecnicos.

Mejora clave:

- Evitar romper contratos o configuraciones al cambiar precios.

### 3.6 Pagos

Agregar:

- Conciliacion con facturas.
- Pagos parciales.
- Descuentos, recargos y notas.
- Recibo descargable.
- Historial por cliente.
- Filtros por metodo, estado, fecha y usuario que registro.

Mejora clave:

- Dar trazabilidad financiera completa y reducir errores manuales.

### 3.7 Facturas

Agregar:

- Generacion masiva y vista previa.
- Estado de factura con linea de tiempo.
- Envio por correo o descarga PDF.
- Reintento de envio.
- Numeracion fiscal configurable.
- Resumen de cartera por cliente.

Mejora clave:

- Separar claramente lo automatico de lo manual.

### 3.8 Tickets

Agregar:

- Prioridad, SLA y fecha compromiso.
- Comentarios internos vs publicos.
- Adjuntos e imagenes.
- Asignacion multiple o re-asignacion.
- Vista tipo lista + kanban opcional.
- Plantillas de respuesta.
- Macros para respuestas rapidas.

Mejora clave:

- Hacer el flujo de soporte rapido y trazable.

### 3.9 Visitas tecnicas

Agregar:

- Calendario por tecnico, zona y fecha.
- Disponibilidad de tecnico.
- Checklist de visita.
- Estados: programada, en ruta, realizada, reprogramada, cancelada.
- Evidencia fotografica y firma.
- Tiempo estimado vs real.

Mejora clave:

- La visita debe ser una orden de trabajo ligera, no solo un evento.

### 3.10 Routers

Agregar:

- Estado de conexion con historial.
- Prueba de conexion desde UI.
- Credenciales segregadas y ocultas por defecto.
- Backups con versionado.
- Uptime, CPU, RAM, interfaces y alertas.
- Asociacion con zona o sitio.

Mejora clave:

- Pasar de inventario a gestion tecnica real.

### 3.11 Monitoreo

Agregar:

- Graficas historicas.
- Alertas por umbral.
- Eventos y caidas.
- Consumo por interfaz.
- Estados de queues o servicios.
- Panel de salud tecnica por router.

Mejora clave:

- Unificar monitoreo tecnico y alertamiento operativo.

### 3.12 Reportes

Agregar:

- Reportes de cartera.
- Rentabilidad por plan.
- Clientes nuevos vs perdidos.
- Tickets por estado y por tecnico.
- Visitas realizadas y pendientes.
- Exportacion filtrada.

Mejora clave:

- No solo graficas; tambien accion y decision.

### 3.13 Acceso y permisos

Agregar:

- Matriz de permisos editable.
- Vista comparativa entre roles.
- Historial de cambios por perfil.
- Clonacion de roles.
- Perfiles base protegidos.

Mejora clave:

- Facilitar gobierno de accesos sin tocar codigo.

### 3.14 Auditoria de seguridad

Agregar:

- Login/logout exitoso y fallido.
- Cambios en permisos y roles.
- Cambios en datos criticos.
- Exportacion de eventos.
- Filtros por usuario, modulo y fecha.

Mejora clave:

- La auditoria debe servir para investigacion real, no solo para ver logs.

### 3.15 Configuracion del sistema

Agregar:

- Datos de la empresa.
- Moneda, timezone, logo y contacto.
- Parametros de facturacion.
- Plantillas de notificaciones.
- Ajustes de corte y suspension.
- Configuracion de integraciones.

Mejora clave:

- Centralizar la operacion sin mezclarla con modulos funcionales.

### 3.16 Portal de cliente

Agregar:

- Estado de cuenta.
- Facturas y pagos.
- Ticket nuevo y seguimiento.
- Datos del servicio.
- Notificaciones.
- Cambio de contrasena.
- Descarga de comprobantes.

Mejora clave:

- Debe ser simple, rapido y de solo lectura en lo sensible.

## 4. Modulos nuevos que si vale la pena agregar

Estos modulos no estaban en el backlog original, pero son muy utiles para un ISP real.

### 4.1 Centro de notificaciones

Motivo:

- Unificar alertas de vencimiento, tickets, visitas, pagos y fallos de router.

Incluye:

- bandeja interna,
- notificaciones in-app,
- plantillas,
- historial de envio.

### 4.2 Base de conocimiento

Motivo:

- Ayuda a soporte y tecnicos a resolver mas rapido.

Incluye:

- articulos,
- categorias,
- busqueda,
- adjuntos,
- markdown.

### 4.3 Inventario tecnico

Motivo:

- Registrar equipos, ONT, radios, switches y material instalado.

Incluye:

- serial,
- estado,
- ubicacion,
- cliente asociado,
- garantia.

### 4.4 Zonas y cobertura

Motivo:

- Necesario para planeacion de red, ventas y soporte.

Incluye:

- zonas,
- cobertura,
- responsable,
- color en mapa,
- capacidad por zona.

### 4.5 Integraciones

Motivo:

- Preparar WhatsApp, correo, pasarela de pago y webhooks sin ensuciar configuracion general.

Incluye:

- credenciales,
- prueba de conexion,
- logs,
- estado de integracion.

### 4.6 Centro de actividad

Motivo:

- Ver todo lo que paso en el sistema por usuario, modulo y fecha.

Incluye:

- cambios,
- accesos,
- acciones criticas,
- exportacion.

## 5. Priorizacion sugerida

### Fase 1: cerrar operacion basica

- Dashboard mejorado.
- Ficha 360 de cliente.
- Tickets con comentarios, prioridad y SLA.
- Visitas con calendario y estados.
- Pagos y facturas con trazabilidad.
- Routers con prueba de conexion y monitoreo basico.

### Fase 2: consolidar administracion

- Matriz de permisos.
- Auditoria completa.
- Configuracion avanzada.
- Reportes mas profundos.
- Importacion/exportacion masiva.

### Fase 3: funciones diferenciales

- Centro de notificaciones.
- Base de conocimiento.
- Inventario tecnico.
- Zonas y cobertura.
- Integraciones.

## 6. Recomendacion de alcance minimo para decir que el frontend esta "listo"

Yo consideraria el frontend listo para empezar backend cuando tenga:

- Login y RBAC completos.
- CRUD principales por modulo.
- Vista detalle por entidad critica.
- Busqueda y filtros.
- Acciones de negocio principales.
- Exportacion basica.
- Auditoria visible.
- Estados vacios y de error consistentes.
- UI responsive y consistente.

## 7. Siguiente paso recomendado

Con este alcance, lo ideal es convertir esta propuesta en una lista de historias o en un roadmap por sprint antes de construir el backend, para que frontend y backend nazcan con el mismo contrato.
