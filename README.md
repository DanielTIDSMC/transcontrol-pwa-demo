# Transcontrol · Control de Taller

Aplicación web instalable para coordinar reportes de fallas, órdenes del taller, técnicos y estado de unidades.

## Perfiles

- **Oscar 1 · Administrador:** acceso a todas las secciones, cuentas, permisos, inventario, órdenes e indicadores.
- **Fernanda · Coordinación:** revisa reportes, asigna técnicos, consulta la flota y confirma los trabajos terminados.
- **Taller · Técnico:** registra una falla con hasta tres fotos, consulta sus asignaciones y actualiza el avance.

Los reportes nuevos notifican a Oscar 1 y Fernanda. La asignación queda pendiente hasta que una persona de coordinación elija al técnico. El taller puede marcar un trabajo como listo para revisión; Fernanda u Oscar lo confirma y lo cierra.

Los permisos se validan en el servidor. El historial de tareas, cambios de estado, notificaciones y fotos se guardan en el backend.

## Ejecutar localmente

Necesitas Node.js 22 o posterior. Instala las dependencias y crea `.env` desde la plantilla:

```powershell
npm install
Copy-Item .env.example .env
```

Edita `.env` y define contraseñas distintas de al menos 12 caracteres para `OSCAR_PASSWORD`, `FERNANDA_PASSWORD` y `WORKSHOP_PASSWORD`. Después ejecuta:

```powershell
npm start
```

Abre `http://127.0.0.1:4173`. Las cuentas iniciales son `oscar1`, `fernanda` y `taller1`; las contraseñas son las que definiste en `.env` durante el primer inicio.

Los datos locales se guardan en `data/`. No subas `.env`, fotos ni el directorio `data/` al repositorio.

## Desplegar una demo en Railway

El archivo `railway.json` configura el inicio del servidor y su comprobación de salud. En Railway crea un proyecto desde el repositorio `DanielTIDSMC/transcontrol-pwa-demo` y despliega la rama `main`.

En **Variables**, define `OSCAR_USERNAME=oscar1`, `OSCAR_NAME=Oscar 1`, `OSCAR_PASSWORD`, `FERNANDA_USERNAME=fernanda`, `FERNANDA_NAME=Fernanda`, `FERNANDA_PASSWORD`, `WORKSHOP_USERNAME=taller1`, `WORKSHOP_NAME=Técnico de taller 1` y `WORKSHOP_PASSWORD`. Cada contraseña debe ser distinta y tener al menos 12 caracteres. Define también `DATA_DIR=/data`.

En **Volumes**, agrega un volumen con punto de montaje `/data` para conservar órdenes y fotos entre reinicios. En **Networking**, genera un dominio público. Usa la app solo como demo con datos ficticios; la prueba y el plan gratuito tienen créditos y límites de recursos, así que revisa **Usage** y no cambies a un plan de pago.

El proyecto genera claves VAPID automáticamente para notificaciones web cuando el paquete `web-push` está instalado. Cada usuario debe iniciar sesión y activar las notificaciones en su dispositivo.

## GitHub Pages

GitHub Pages sigue publicando una vista estática de demostración. No puede ejecutar el servidor Node ni guardar tareas compartidas, cuentas o fotos. Para probar ese flujo usa la URL pública del servicio Node en Railway.

## Datos de demostración

Los tableros heredados de órdenes, bahías, unidades, almacén e indicadores conservan datos de muestra. El nuevo flujo de reportes, asignaciones y estados sí usa el backend persistente.
