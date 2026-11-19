# Mesa de ayuda TICS · TransAtlante

Aplicación web para que el personal de TransAtlante reporte problemas de tecnología y el equipo TICS dé seguimiento a cada ticket.

## Flujo de atención

- **Colaborador:** crea tickets, agrega categoría, prioridad, ubicación y evidencia, y consulta el avance de sus solicitudes.
- **Equipo TICS:** consulta los tickets, se los asigna, actualiza el estado y marca la solicitud como resuelta.
- **Administrador:** administra usuarios y cierra tickets resueltos.

Los estados son Nuevo, Asignado, En atención, Resuelto y Cerrado. El servidor valida los permisos y conserva tickets, historial, avisos y archivos en el directorio configurado por `DATA_DIR`.

## Ejecutar localmente

Necesitas Node.js 22 o posterior.

```powershell
npm install
Copy-Item .env.example .env
```

Define tres contraseñas distintas de al menos 12 caracteres en `.env` y ejecuta:

```powershell
npm start
```

Abre `http://127.0.0.1:4173`. Las cuentas iniciales son `admin`, `tics` y `colaborador`; usa las contraseñas definidas en `.env`. El administrador puede crear las cuentas reales del personal y desactivar la cuenta de prueba.

## Desplegar en Render

El Blueprint `render.yaml` define un servicio Node gratuito y el chequeo de salud `/api/health`.

1. Sube este proyecto a un repositorio Git y crea un **Blueprint** en Render apuntando al repositorio.
2. Elige el plan **Free** y define `ADMIN_PASSWORD`, `TICS_PASSWORD` y `EMPLOYEE_PASSWORD` con contraseñas únicas de al menos 12 caracteres.
3. Confirma la creación del servicio y espera a que finalice el despliegue. Render asignará una URL pública.
4. Inicia sesión como administrador y crea las cuentas de colaboradores y personal TICS. Desactiva `colaborador` cuando termines de configurar el acceso real.

## Límites del plan gratuito

Esta configuración sirve para una prueba de concepto. Render duerme el servicio gratuito tras 15 minutos sin tráfico y puede reiniciarlo; al dormir, reiniciar o volver a desplegar, borra los cambios del sistema de archivos. Como esta versión guarda tickets, usuarios y adjuntos en archivos locales, esos datos pueden desaparecer. No la uses aún para solicitudes reales de la empresa.

Render Postgres gratuito tampoco resuelve el almacenamiento permanente: vence a los 30 días. Para un piloto con tickets reales sin pagar, el siguiente paso es migrar los datos a una base de datos gratuita externa y guardar los adjuntos ahí; esa opción también tiene límites de uso e inactividad.

## Datos y credenciales

No subas `.env`, contraseñas ni el directorio `data/` al repositorio. Las credenciales de producción se configuran como variables privadas del servicio en Render. Las cuentas iniciales solo se crean cuando el almacén no contiene usuarios.
