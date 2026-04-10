# Arquitectura de componentes (frontend)

Esta guia define cuando crear un componente global y cuando mantenerlo dentro de un modulo.

## Regla general

- Global (`src/components/shared`): patrones reutilizables por 3 o mas modulos, sin logica de negocio especifica.
- Por modulo (`src/modules/<modulo>/components`): UI con reglas, labels o flujos propios del modulo.

## Componentes globales actuales

- `KpiCard`: tarjeta de metricas generica.
- `FilterPanel`: contenedor visual para filtros.
- `PageHeader`: encabezado estandar de pagina con titulo, descripcion y acciones.
- `DataTableShell`: contenedor visual base para tablas con scroll horizontal.

## Que dejar por modulo

- Formularios con validaciones del dominio (`ClientForm`, `TicketForm`, etc.).
- Tablas con columnas especificas del dominio (`ClientsTable`, `TicketsTable`, etc.).
- Componentes que llaman servicios del modulo.

## Criterios para promover un componente a global

- Se repite en 3 o mas modulos con la misma estructura visual.
- No depende de tipos o servicios de un modulo puntual.
- Cambiarlo en un solo lugar aporta consistencia en toda la app.

## Convencion sugerida

- Mantener piezas visuales base en `shared`.
- Mantener composicion de pantalla y negocio en cada modulo.
- Reusar `StateMessage` para estados `loading/error/empty` en toda pantalla de listado.
