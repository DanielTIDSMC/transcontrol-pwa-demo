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

El Blueprint `render.yaml` define el servicio Node, el chequeo de salud `/api/health`, las variables iniciales y un disco persistente montado en `/var/data` para tickets y adjuntos.

1. Sube este proyecto a un repositorio Git y crea un **Blueprint** en Render apuntando al repositorio.
2. En el formulario de Render, define `ADMIN_PASSWORD`, `TICS_PASSWORD` y `EMPLOYEE_PASSWORD`. Usa contraseñas únicas de al menos 12 caracteres.
3. Confirma la creación del servicio y espera a que finalice el despliegue. Render asignará una URL pública.
4. Inicia sesión como administrador y crea las cuentas de colaboradores y personal TICS. Desactiva `colaborador` cuando termines de configurar el acceso real.

El disco persistente requiere un tipo de servicio de Render que admita discos. No elimines ni reemplaces el disco si necesitas conservar los datos. El almacenamiento actual es JSON en un solo servicio Node; para mayor concurrencia o múltiples instancias conviene migrar a PostgreSQL y almacenamiento de objetos.

## Datos y credenciales

No subas `.env`, contraseñas ni el directorio `data/` al repositorio. Las credenciales de producción se configuran como variables privadas del servicio en Render. Las cuentas iniciales solo se crean cuando el almacén no contiene usuarios.
