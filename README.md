# Transcontrol · Centro de control

Prototipo visual e interactivo de una PWA para seguimiento de viajes, flota y alertas de una empresa de transportes.

## Demo

Al publicarse, GitHub Pages servirá la aplicación como sitio estático. Los datos de viajes, clientes, unidades e indicadores son ficticios y sirven únicamente para recorrer el prototipo.

## Ejecutar localmente

Necesitas Node.js. En esta carpeta ejecuta:

```powershell
node server.js
```

Abre `http://127.0.0.1:4173`.

## Publicación

El workflow de GitHub Actions publica la app al hacer push a `main`. Solo publica los archivos estáticos necesarios para la demo; no publica el documento de preparación de Gamma ni la imagen original del logo.

## Alcance del prototipo

- Navegación por centro de control, viajes, mapa, alertas, unidades, clientes y reportes.
- Datos de demostración locales, sin conexión a sistemas de transporte.
- Notificaciones de navegador de prueba; no existe todavía un servicio backend de notificaciones.
- No usar para coordinar viajes reales ni como sistema de producción.
