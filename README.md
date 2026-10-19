# Transcontrol · Control de Taller y Mantenimiento

Prototipo visual e interactivo de una PWA para control de taller mecánico, mantenimiento preventivo y correctivo de flota vehicular, órdenes de trabajo (OTs), ocupación de bahías y almacén de refacciones.

## Demo

Al publicarse, GitHub Pages servirá la aplicación como sitio estático. Los datos de órdenes de trabajo, refacciones, bahías, unidades e indicadores son ficticios y sirven únicamente para recorrer el prototipo.

## Ejecutar localmente

Necesitas Node.js. En esta carpeta ejecuta:

```powershell
node server.js
```

Abre `http://127.0.0.1:4173`.

## Publicación

El workflow de GitHub Actions publica la app al hacer push a `main`. Solo publica los archivos estáticos necesarios para la demo; no publica el documento de preparación de Gamma ni la imagen original del logo.

## Alcance del prototipo enfocado al Taller

- **Centro de control:** OTs en proceso, disponibilidad de flota, alertas de mantenimiento y piso de taller.
- **Órdenes de trabajo (OTs):** Registro, diagnóstico, refacciones asignadas, mecánico y avance por orden.
- **Bahías del taller en vivo:** Plano interactivo del taller techado, fosas de servicio pesado y patio de maniobras.
- **Alertas de taller:** Preventivos vencidos por odómetro, refacciones agotadas y fallas en checklist pre-viaje.
- **Flota y Unidades:** Odómetro, condición mecánica, historial de intervenciones y próximo preventivo.
- **Almacén de refacciones:** Inventario de piezas críticas (frenos, filtros, turbos, lubricantes, neumáticos) y control de stock mínimo.
- **Reportes de taller:** Cumplimiento preventivo vs. correctivo, tiempo promedio de reparación en bahía (MTTR) y disponibilidad de flota.
- **Guía interactiva (Tour):** Recorrido paso a paso adaptado a las responsabilidades del taller.
