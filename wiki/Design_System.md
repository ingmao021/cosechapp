# Design System — CosechApp

Taller de Design System aplicado a **CosechApp**, la app móvil de recolección y pagos para caficultores definida en el PRD del proyecto. Este documento cubre los tres puntos de entrega: Contenido, Jerarquía del contenido y Navegación, apoyándose en la jerarquía de componentes (átomos, moléculas, organismos, templates, páginas) y en los Design Tokens que sostienen la consistencia visual del sistema.

---

## 1. Contenido

Define qué información y elementos se muestran en cada pantalla de CosechApp, con base en las funcionalidades ya definidas en el PRD.

### 1.1 Login / Registro
- Campo cédula, campo contraseña.
- Foto de perfil (opcional).
- Botón "Ingresar" / enlace "Crear cuenta".
- Sin campos de verificación adicionales (sin correo ni teléfono), por la baja alfabetización digital del usuario objetivo.

### 1.2 Inicio (cosecha activa)
- Nombre de la cosecha activa (ej. "Primer pasón") y su precio por kilo.
- Acceso directo a "Pesar" (lleva a Cuadrillas).
- Aviso del precio actual publicado por la FNC, con fecha del último dato.
- Indicador de última sincronización (si hay pesadas/pagos aún sin sincronizar).
- Botón "Cerrar cosecha" (lleva al flujo de venta y costos).
- Si no hay cosecha activa: invitación a abrir una nueva, con campo de nombre libre.

### 1.3 Cuadrillas
- Lista de cuadrillas de la cosecha activa (nombre + cantidad de recolectores).
- Botón para crear una nueva cuadrilla.
- Cada cuadrilla se crea desde cero en cada cosecha.

### 1.4 Detalle de cuadrilla
- Lista de recolectores asignados (nombre/alias).
- Acumulado de kilos del día por recolector, visible en la misma fila.
- Botón para agregar un recolector a la cuadrilla (desde el catálogo de trabajadores o nuevo).

### 1.5 Detalle de recolector (dentro de la cosecha)
- Nombre/alias del recolector.
- Lista de pesadas del día, con botón "+" para agregar cuantas sean necesarias.
- Acumulado de la semana y acumulado del ciclo completo.
- Indicador de alimentación (con/sin), con precio por comida o total del día.
- Botón "Pagar ahora" (muestra el monto calculado antes de confirmar).
- Historial de pagos ya realizados a ese recolector en esta cosecha.

### 1.6 Registro de pesada
- Campo numérico de kilos.
- Fecha y hora (automática).
- Confirmación visual al guardar (funciona sin conexión).

### 1.7 Catálogo de trabajadores
- Lista global de trabajadores (nombre, apellido, alias, teléfono).
- Botón para agregar un nuevo trabajador.
- Acceso desde aquí para asignarlo a una cuadrilla de la cosecha activa.

### 1.8 Cierre de cosecha
- Campo de kilos secos reales vendidos y precio de venta.
- Ganancia bruta calculada automáticamente (venta − pagos a recolectores).
- Sección de costos de producción: lista de gastos que el caficultor va agregando (descripción + monto).
- Ganancia de la cosecha (ganancia bruta − costos), mostrada con esa etiqueta explícita para no confundirla con la rentabilidad total de la finca.
- Confirmación para archivar la cosecha en el historial.

### 1.9 Historial de cosechas
- Lista de cosechas cerradas (nombre, fechas, ganancia de la cosecha).
- Acceso al detalle de cada una (recolectores, pagos, venta, costos).

### 1.10 Precio y noticias
- Precio actual del café publicado por la FNC, con fecha.
- Lista de noticias/tips (fuentes: FNC y Cenicafé), cada una con resumen corto y enlace a la fuente original.

### 1.11 Notificaciones
- Historial de notificaciones de cambio de precio (fecha + valor).

### 1.12 Perfil
- Foto de perfil, cédula (no editable), opción de cambiar contraseña.
- Acceso al catálogo de trabajadores.
- Cerrar sesión.
- Aviso de privacidad / política de tratamiento de datos (habeas data).

---

## 2. Jerarquía del contenido

### 2.1 Jerarquía de componentes

```
Design System — CosechApp
│
├── Átomos
│   ├── Botón primario (ej. "Guardar pesada")
│   ├── Botón de ícono (ej. "+" para agregar pesada)
│   ├── Botón de alerta (ej. "Cerrar cosecha")
│   ├── Input numérico (kilos, precios)
│   ├── Input de texto (nombre, alias, nombre de cosecha)
│   ├── Etiqueta de estado (activa / cerrada / archivado)
│   ├── Icono (recolector, cuadrilla, balanza, pago, venta, precio, noticia, notificación)
│   ├── Avatar / foto de perfil
│   └── Color y tipografía (ver Design Tokens)
│
├── Moléculas
│   ├── Tarjeta de recolector (nombre/alias + acumulado del día)
│   ├── Campo de pesada (input numérico + botón "+")
│   ├── Fila de pago (monto + fecha + estado)
│   ├── Chip "con alimentación" / "sin alimentación"
│   ├── Tarjeta de noticia (título + fuente + enlace)
│   └── Tarjeta de cosecha (nombre + fecha + ganancia, para el historial)
│
├── Organismos
│   ├── Header de cosecha activa (nombre + precio/kilo + botón cerrar cosecha)
│   ├── Lista de cuadrillas
│   ├── Lista de recolectores de una cuadrilla
│   ├── Formulario de cierre de cosecha (venta + costos)
│   ├── Panel de precio y noticias
│   └── Barra de navegación inferior
│
├── Templates
│   ├── Template de lista (header + lista de tarjetas + botón agregar) → Cuadrillas, Trabajadores, Historial
│   ├── Template de detalle (header + bloques de información + acciones) → Detalle de recolector, Detalle de cosecha
│   └── Template de formulario (campos + botón de acción) → Registro de pesada, Cierre de cosecha, Login
│
└── Páginas
    ├── Login / Registro
    ├── Inicio (cosecha activa)
    ├── Cuadrillas
    ├── Detalle de cuadrilla
    ├── Detalle de recolector
    ├── Registro de pesada
    ├── Catálogo de trabajadores
    ├── Cierre de cosecha
    ├── Historial de cosechas
    ├── Precio y noticias
    ├── Notificaciones
    └── Perfil
```

### 2.2 Design Tokens

Elegidos deliberadamente a partir del propio contexto de CosechApp: reemplaza un cuaderno de papel en el cafetal, así que la tipografía de título tiene un aire de libro de registro, y la paleta viene del cafetal mismo (hoja, cereza madura, tierra) en vez de la paleta genérica "café" (crema + terracota) que se ve en cualquier producto sobre café.

**Colores**
```
--color-primary: #2F4A3D      /* verde cafetal — hoja de café */
--color-secondary: #C98A2B    /* dorado cereza — café en punto óptimo de recolección */
--color-accent: #7A2E22       /* rojo tierra — cereza madura, uso moderado (ej. "Pagar ahora") */
--color-background: #F6F3EC   /* pergamino cálido — el papel que la app reemplaza */
--color-surface: #FFFFFF
--color-text: #2B2420         /* café tostado oscuro, no negro puro */
--color-border: #D8D2C0
```

**Tipografía**
```
--font-family-display: "Zilla Slab"   /* títulos — remite al cuaderno/libro de registro */
--font-family-body: "Inter"           /* cuerpo, números, UI — alta legibilidad en campo */
--font-size-xs: 12sp    /* metadatos, ej. fecha de una pesada */
--font-size-sm: 14sp
--font-size-md: 16sp    /* cuerpo base */
--font-size-lg: 20sp    /* subtítulos de sección */
--font-size-xl: 28sp    /* título de pantalla */
--font-weight-regular: 400
--font-weight-bold: 700
```

**Espaciado** (grid base de 4dp)
```
--spacing-xs: 4dp
--spacing-sm: 8dp
--spacing-md: 16dp
--spacing-lg: 24dp
--spacing-xl: 32dp
```

**Otros tokens**
```
--radius-sm: 6dp
--radius-md: 12dp       /* tarjetas de recolector y cuadrilla */
--radius-full: 999dp    /* botones de acción principal, ej. "Pagar ahora" */
--shadow-card: 0 1dp 3dp rgba(43,36,32,0.12)
--touch-target-min: 48dp  /* mínimo de Material Design en Android — corregido desde el borrador inicial, que usaba 44px (estándar iOS, no aplica aquí) */
```

> **Nota de unidades:** en Android, las dimensiones y espaciados se expresan en **dp** (density-independent pixels), y los tamaños de tipografía en **sp** (scale-independent pixels), para que respeten el ajuste de tamaño de fuente del sistema. Todos los tokens de esta sección deben leerse con esas unidades, no como píxeles CSS fijos.

### 2.3 Especificaciones pixel-perfect por componente

Medidas exactas listas para implementación, siguiendo la grilla base de 4dp:

| Componente | Alto | Padding interno | Radio | Ícono |
|---|---|---|---|---|
| Botón primario | 48dp | 24dp horizontal | 24dp (pill) | 20dp si lleva ícono |
| Botón de ícono ("+") | 48dp × 48dp | — | 24dp (circular) | 24dp |
| Input de texto/numérico | 48dp mínimo | 16dp horizontal | 8dp | — |
| Tarjeta de recolector | 64dp mínimo | 16dp | 12dp | 24dp (avatar/ícono) |
| Fila de la lista (cuadrillas, trabajadores) | 56dp | 16dp horizontal | — | 24dp |
| Chip ("con alimentación") | 28dp | 12dp horizontal | 999dp (pill) | 16dp si lleva ícono |
| Barra de navegación inferior | 56dp + inset de gestos del sistema | — | — | 24dp por pestaña |
| Header de cosecha activa | 96dp | 16dp | — | — |
| Separación entre tarjetas en una lista | — | 8dp vertical | — | — |
| Margen lateral de pantalla | — | 16dp | — | — |

Todas las medidas son múltiplos de 4dp, consistentes con la grilla base definida en los Design Tokens.

### 2.4 Breakpoints (anchos de pantalla Android)

CosechApp es de una sola columna en todos los anchos objetivo (no hay layout multi-columna, dado que es una app operativa de campo, no un dashboard). Los breakpoints ajustan tamaño de fuente y márgenes, no la estructura:

| Rango | Ancho de referencia | Ajuste |
|---|---|---|
| Compacto | 360dp (ej. gama baja/media) | Margen lateral 16dp, tipografía en la base definida en tokens |
| Estándar | 390–412dp (mayoría de equipos Android actuales) | Igual que compacto |
| Amplio | 430dp+ (equipos grandes) | Margen lateral 24dp, sin cambio de tipografía |

No se define un breakpoint de tablet en esta versión, ya que el PRD define la app como uso exclusivo en celular Android durante la recolección en campo.

### 2.5 Jerarquía visual dentro de cada pantalla

- **Nivel 1 (título de pantalla):** `--font-size-xl` + `--font-family-display`. Ej. "Cuadrillas", "Cierre de cosecha".
- **Nivel 2 (secciones dentro de la pantalla):** `--font-size-lg` + `--font-family-body` en negrita. Ej. "Ganancia de la cosecha", "Costos de producción".
- **Nivel 3 (elementos individuales):** `--font-size-md`, peso regular. Ej. el nombre de cada recolector, cada línea de costo.
- **Nivel 4 (metadatos):** `--font-size-sm` o `--font-size-xs`, color de texto atenuado. Ej. fecha/hora de una pesada, "última sincronización hace 2 horas".

Los íconos acompañan siempre al texto (nunca solos) en las acciones principales, dada la prioridad de simplicidad visual para usuarios con baja alfabetización digital.

---

## 3. Navegación

### 3.1 Estructura de navegación

Navegación principal por barra inferior de pestañas (patrón estándar en apps Android), con 4 accesos directos y flujos de profundización (drill-down) dentro de cada uno:

```
Login / Registro
   │ (autenticación)
   ▼
┌─────────────────────────────────────────────┐
│  Barra inferior: Inicio | Precio&Noticias |  │
│                  Historial | Perfil          │
└─────────────────────────────────────────────┘

Inicio (cosecha activa)
│
├── Cuadrillas
│   └── Detalle de cuadrilla
│       └── Detalle de recolector
│           ├── Registro de pesada
│           └── Pagar ahora (confirmación de monto)
│
└── Cerrar cosecha
    └── Registro de venta y costos → Resumen de ganancia de la cosecha

Precio y Noticias
└── Notificaciones (también accesible desde el ícono de campana en cualquier pantalla)

Historial de cosechas
└── Detalle de cosecha cerrada

Perfil
├── Catálogo de trabajadores
├── Cambiar contraseña
├── Aviso de privacidad
└── Cerrar sesión
```

### 3.2 Página principal
**Inicio**, que muestra la cosecha activa y es el punto de entrada al flujo más usado (pesar y pagar recolectores), consistente con que el uso principal ocurre en el cafetal.

### 3.3 Elementos de navegación
- Barra inferior de pestañas (4 ítems: Inicio, Precio y Noticias, Historial, Perfil).
- Dentro de cada pestaña, navegación por profundización (tocar una tarjeta lleva al detalle) con botón de "volver" estándar.
- "Cuadrillas" y "Cerrar cosecha" no son pestañas propias: son acciones dentro de Inicio, porque dependen de que haya una cosecha activa.
- El catálogo de trabajadores y el aviso de privacidad viven dentro de Perfil, por ser de uso ocasional (no diario).

### 3.4 Niveles de navegación
1. **Nivel 0 — Autenticación:** Login/Registro (fuera de la barra de pestañas).
2. **Nivel 1 — Pestañas principales:** Inicio, Precio y Noticias, Historial, Perfil.
3. **Nivel 2 — Listas:** Cuadrillas, Catálogo de trabajadores, lista de cosechas cerradas.
4. **Nivel 3 — Detalle:** Detalle de cuadrilla, Detalle de cosecha cerrada.
5. **Nivel 4 — Acción puntual:** Detalle de recolector, Registro de pesada, Pagar ahora, Cierre de cosecha (venta y costos).

---

## Diseño final (síntesis del proceso)

```
Contenido (sección 1)
    ↓
Design Tokens (sección 2.2)
    ↓
Átomos → Moléculas → Organismos → Templates → Páginas (sección 2.1)
    ↓
Jerarquía visual dentro de cada pantalla (sección 2.3)
    ↓
Navegación (sección 3)
    ↓
Diseño final de CosechApp
```

El resultado es un sistema donde cada pantalla —desde Inicio hasta Cierre de cosecha— se construye reutilizando los mismos átomos y moléculas (tarjeta de recolector, campo de pesada, chip de alimentación), con una jerarquía visual consistente y una navegación de máximo 4 niveles de profundidad, pensada para un usuario que la usará sobre todo con las manos ocupadas, en el cafetal, con o sin conexión.
