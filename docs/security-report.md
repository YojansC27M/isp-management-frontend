# Frontend Security Report (OWASP-aligned)

Fecha: 2026-04-10
Alcance: Aplicacion frontend (React + Vite), sin backend conectado.

## Resumen ejecutivo

- Riesgo alto: 0
- Riesgo medio: 3
- Riesgo bajo: 6

Estado general: base solida para entorno local y pre-integracion, con mejoras aplicadas en manejo de errores, sesion y resiliencia de red.

## Riesgos y estado

1. A01 - Broken Access Control
- Nivel: Medio
- Estado: Mitigado parcialmente
- Evidencia: rutas protegidas por permiso/rol y validacion de perfil activo.
- Pendiente: la autoridad final debe vivir en backend (token + ACL server-side).

2. A02 - Cryptographic Failures
- Nivel: Medio
- Estado: Pendiente
- Evidencia: tokens persistidos en localStorage para entorno local.
- Recomendacion: migrar a cookies httpOnly + secure cuando exista backend real.

3. A03 - Injection
- Nivel: Bajo
- Estado: Mitigado
- Evidencia: no se detecta uso de eval/new Function/dangerouslySetInnerHTML en codigo fuente.

4. A04 - Insecure Design
- Nivel: Medio
- Estado: Mitigado parcialmente
- Evidencia: separacion de roles/permisos y auditoria local.
- Pendiente: controles de fraude/rate-limit y auditoria inmutable en backend.

5. A05 - Security Misconfiguration
- Nivel: Bajo
- Estado: Mitigado parcialmente
- Evidencia: configuracion por entorno disponible, mocks habilitables por variable.
- Pendiente: CSP y cabeceras de seguridad en servidor/CDN.

6. A06 - Vulnerable and Outdated Components
- Nivel: Bajo
- Estado: Pendiente continuo
- Evidencia: dependencias versionadas.
- Recomendacion: ejecutar escaneo periodico (`npm audit`, SCA en CI).

7. A07 - Identification and Authentication Failures
- Nivel: Bajo
- Estado: Mitigado parcialmente
- Evidencia: guardas de rutas + logout + control de perfil activo.
- Pendiente: expiracion/rotacion de tokens y refresh token en backend.

8. A08 - Software and Data Integrity Failures
- Nivel: Bajo
- Estado: Pendiente
- Evidencia: falta pipeline de firma/verificacion de artefactos.
- Recomendacion: proteger cadena CI/CD y publicar builds con integridad.

9. A09 - Security Logging and Monitoring Failures
- Nivel: Bajo
- Estado: Mitigado parcialmente
- Evidencia: auditoria de cambios local en frontend.
- Pendiente: envio a backend/SIEM con retencion y alertas.

10. A10 - SSRF
- Nivel: Bajo
- Estado: Bajo impacto en frontend
- Evidencia: frontend no expone fetch arbitrario de servidor.

## Mejoras aplicadas en esta fase

- Capa central `ApiError` para normalizar errores de red/API.
- Politicas por dominio en axios con:
  - timeout por dominio
  - retry controlado para metodos idempotentes
  - soporte de cancelacion por `cancelKey` para requests repetidas
- Manejo de sesion centralizado para tokens.
- Validacion defensiva de datos persistidos en localStorage (usuario/permisos/auditoria).

## Recomendaciones inmediatas (siguiente iteracion)

1. Integrar backend auth real con cookies httpOnly.
2. Definir contrato de errores server-side (`code`, `message`, `traceId`) y usarlo en `ApiError`.
3. Activar seguridad en despliegue: CSP, HSTS, X-Frame-Options, Referrer-Policy.
4. Configurar CI con `lint + test + build + audit`.
