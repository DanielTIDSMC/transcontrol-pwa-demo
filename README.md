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

## Desplegar el sistema colaborativo en Render

El archivo `render.yaml` define un servicio Node con disco persistente para reportes, suscripciones push y fotos. En Render crea un **Blueprint** desde este repositorio y establece las contraseñas iniciales cuando las solicite. El servicio con disco persistente requiere un plan de pago de Render; revisa el plan y el costo en tu cuenta antes de crearlo.

El proyecto genera y conserva sus claves VAPID en el disco del servicio para Web Push. Cada persona debe iniciar sesión y activar las notificaciones en su dispositivo. En iPhone, instala la app desde Safari a la pantalla de inicio y concede permiso de notificaciones.

## GitHub Pages

GitHub Pages sigue publicando una vista de demostración estática. No puede ejecutar el servidor Node ni guardar tareas compartidas, cuentas o fotos. El sistema colaborativo se sirve desde el servicio Node en Render.

## Datos de demostración

Los tableros heredados de órdenes, bahías, unidades, almacén e indicadores conservan datos de muestra. El nuevo flujo de reportes, asignaciones y estados sí usa el backend persistente.
