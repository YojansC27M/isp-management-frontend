# ISP Management Monorepo (Frontend + Backend)

Guia de primera ejecucion para levantar todo el proyecto en local, incluyendo integracion con MikroTik en maquina virtual.

## 1) Que incluye este monorepo

- Frontend (Vite + React): raiz del repositorio.
- Backend (NestJS + Prisma): carpeta `backend/`.
- Base de datos: PostgreSQL.

## 2) Prerrequisitos

Instala antes de empezar:

- Node.js 20+ (recomendado LTS).
- npm 10+.
- PostgreSQL 14+.
- VirtualBox, VMware o similar para la VM de MikroTik (RouterOS CHR).

## 3) Variables de entorno

### 3.1 Frontend (`.env` en la raiz)

1. Copia `.env.example` a `.env`.
2. Verifica estos campos:

```env
VITE_API_URL=http://localhost:8001/api/v1
VITE_USE_MOCKS=false
VITE_DASHBOARD_POLLING_MS=60000
```

Campos que normalmente se cambian:

- `VITE_API_URL`: URL del backend.

### 3.2 Backend (`backend/.env`)

1. Copia `backend/.env.example` a `backend/.env`.
2. Cambia como minimo:

```env
PORT=8001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/isp_management"
JWT_SECRET="cambia-esto-por-un-secret-largo"
APP_ENCRYPTION_KEY="cambia-esto-por-una-clave-larga"
BOOTSTRAP_ADMIN_EMAIL="admin@tu-dominio.com"
BOOTSTRAP_ADMIN_PASSWORD="TuPasswordSegura123!"
BOOTSTRAP_ADMIN_NAME="System Admin"
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Campos que normalmente se cambian:

- `DATABASE_URL`: usuario, password, host, puerto y nombre de base.
- `JWT_SECRET`: obligatorio y seguro.
- `APP_ENCRYPTION_KEY`: clave para cifrado interno.
- `BOOTSTRAP_ADMIN_*`: usuario admin inicial.
- `CORS_ALLOWED_ORIGINS`: origenes permitidos del frontend.

## 4) MikroTik en maquina virtual (RouterOS CHR)

## Objetivo

El backend se conecta al REST API de RouterOS, no el frontend.

### 4.1 Preparar la VM

1. Crea/inicia una VM con RouterOS CHR.
2. Configura red de la VM para que sea alcanzable desde tu PC.
3. En RouterOS habilita servicio HTTP/HTTPS para REST API.
4. Crea usuario para API (ejemplo: `apiuser`) con permisos necesarios.

### 4.2 Campos MikroTik que debes cambiar en `backend/.env`

```env
MIKROTIK_HOST=192.168.56.2
MIKROTIK_PORT=80
MIKROTIK_USER=apiuser
MIKROTIK_PASSWORD=change-me
MIKROTIK_MODE=live
MIKROTIK_USE_SSL=false
MIKROTIK_TLS_REJECT_UNAUTHORIZED=false
```

Que significa cada campo:

- `MIKROTIK_HOST`: IP de la VM RouterOS vista desde tu host.
- `MIKROTIK_PORT`: puerto del servicio REST (80 o 443 normalmente).
- `MIKROTIK_USER`: usuario API de RouterOS.
- `MIKROTIK_PASSWORD`: password del usuario API.
- `MIKROTIK_MODE`:
  - `live`: conexion real a RouterOS.
  - `mock`: simula respuestas (util para desarrollar sin VM).
- `MIKROTIK_USE_SSL`:
  - `true`: usa HTTPS.
  - `false`: usa HTTP.
- `MIKROTIK_TLS_REJECT_UNAUTHORIZED`:
  - `true`: valida certificado TLS.
  - `false`: permite certificado self-signed/no confiable (solo dev).

Si no tienes la VM lista todavia, usa temporalmente:

```env
MIKROTIK_MODE=mock
```

## 5) Levantar el proyecto por primera vez

### 5.1 Instalar dependencias

En la raiz:

```bash
npm install
```

En `backend/`:

```bash
cd backend
npm install
```

### 5.2 Crear base de datos y schema

Asegura que PostgreSQL este corriendo y que exista la base `isp_management` (o la que pongas en `DATABASE_URL`).

Luego, desde `backend/`:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5.3 Ejecutar backend

Desde `backend/`:

```bash
npm run start:dev
```

Endpoints utiles:

- API base: `http://localhost:8001/api/v1`
- Swagger: `http://localhost:8001/docs`

### 5.4 Ejecutar frontend

En otra terminal, desde la raiz:

```bash
npm run dev
```

Frontend:

- `http://localhost:5173`

## 6) Verificacion rapida

1. Abre `http://localhost:8001/docs` y confirma que el backend responde.
2. Abre `http://localhost:5173`.
3. Inicia sesion con el admin configurado en `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD`.
4. Si estas en `MIKROTIK_MODE=live`, prueba conexion de router desde el modulo de Routers.

## 7) Problemas comunes

- Error de CORS: revisa `CORS_ALLOWED_ORIGINS` en `backend/.env`.
- Error de login inicial: confirma que corriste `npm run prisma:seed` en backend.
- Error de DB: valida `DATABASE_URL` y que PostgreSQL este activo.
- Error MikroTik en `live`: valida IP/puerto de la VM, credenciales, y servicio HTTP/HTTPS habilitado.

## 8) Comandos utiles

### Frontend (raiz)

```bash
npm run dev
npm run build
npm run test
```

### Backend (`backend/`)

```bash
npm run start:dev
npm run build
npm run test
npm run prisma:migrate
npm run prisma:seed
```
