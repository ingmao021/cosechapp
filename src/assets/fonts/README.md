# Fuentes CosechApp

Fuentes **locales** (no CDN) para que la app funcione sin conexión. Se cargan desde `src/theme/variables.css`.

| Fuente | Peso | Archivo | Uso |
|--------|------|---------|-----|
| Inter (variable) | 100–900, eje de tamaño óptico | `InterVariable.woff2` | Toda la interfaz: títulos, cuerpo, botones, campos |
| Zilla Slab | Regular (400) | `ZillaSlab-Regular.woff2` | Marca y cifras grandes |
| Zilla Slab | Bold (700) | `ZillaSlab-Bold.woff2` | Wordmark "CosechApp" y cifras grandes (kilos, pesos, precio FNC) |

Origen: Inter v4.1 de [rsms/inter](https://github.com/rsms/inter/releases/tag/v4.1) (archivo `web/InterVariable.woff2`, completo);
Zilla Slab de `@fontsource/zilla-slab` v5.3.0, subconjunto *latin* (incluye tildes y ñ).
Licencia: SIL Open Font License 1.1 (ver `OFL-Inter.txt` y `OFL-ZillaSlab.txt`).
