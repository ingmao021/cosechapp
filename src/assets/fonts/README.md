# Fuentes CosechApp

Esta carpeta debe contener los archivos de fuente **locales** (no CDN) para que la app funcione sin conexión.

## Fuentes requeridas

| Fuente | Peso | Archivo | Uso |
|--------|------|---------|-----|
| Zilla Slab | Regular (400) | `ZillaSlab-Regular.ttf` | Títulos (display) - peso normal |
| Zilla Slab | Bold (700) | `ZillaSlab-Bold.ttf` | Títulos (display) - peso bold |
| Inter | Regular (400) | `Inter-Regular.ttf` | Cuerpo, números, UI - peso normal |
| Inter | Bold (700) | `Inter-Bold.ttf` | Cuerpo, números, UI - peso bold |

## Descarga

- **Zilla Slab**: https://fonts.google.com/specimen/Zilla+Slab (licencia SIL Open Font License)
- **Inter**: https://fonts.google.com/specimen/Inter (licencia SIL Open Font License)

Descargar los archivos `.ttf` de los pesos 400 y 700 de cada familia y colocarlos aquí con los nombres exactos arriba.

## Nota

Las fuentes se declaran en `src/theme/variables.css` con `@font-face` apuntando a estos archivos locales.
La app **no** carga fuentes desde Google Fonts CDN — debe verse idéntica offline.