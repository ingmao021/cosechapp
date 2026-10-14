# Design System — CosechApp

Taller de Design System aplicado a **CosechApp**, la app móvil de recolección y pagos para caficultores definida en el PRD del proyecto. Este documento cubre los tres puntos de entrega: Contenido, Jerarquía del contenido y Navegación, apoyándose en la jerarquía de componentes (átomos, moléculas, organismos, templates, páginas) y en los Design Tokens que sostienen la consistencia visual del sistema.

---

## 1. Contenido

Define qué información y elementos se muestran en cada pantalla de CosechApp, con base en las funcionalidades ya definidas en el PRD.

### 1.0 Splash
Arranque animado mientras se verifica la sesión:
1. **Splash nativo** (Android): un instante en blanco `#FFFFFF` mientras carga el WebView. Configurado en `capacitor.config.ts` (`SplashScreen`, `launchAutoHide: false`) y en `styles.xml` (`windowSplashScreenBackground` blanco, también con el teléfono en modo oscuro).
2. **`SplashPage`:** oculta el nativo y muestra el fondo de café (`splash-bg.webp`), luego el costal sube y aparece (`splash-sack.webp`) y tres granos laten mientras carga. Con movimiento reducido todo aparece con un fundido.
- Sin controles ni texto interactivo: es una pantalla de transición, no requiere acción del usuario.
- Duración: lo que tarde **lo más largo** entre 1,8 s (para que la entrada se vea completa) y la verificación de sesión (ver sección 3.1). Sale con un fundido de 250 ms hacia Login o Inicio.

### 1.1 Login / Registro
**Login:**
- Logo (`src/assets/brand/logo.png`, versión con fondo transparente de `LOGO.png`) y una frase corta de propósito.
- Campo cédula (teclado numérico) y campo contraseña con botón mostrar/ocultar.
- Botón "Ingresar" y enlace "Crear cuenta".

**Registro:** los mismos campos más "Confirmar contraseña", con la regla de la contraseña visible como texto de ayuda ("Mínimo 6 caracteres").

**Reglas para ambas pantallas:**
- **Sin foto de perfil.** Una foto "opcional" en el formulario de entrada distrae y no aporta nada para ingresar; la foto vive solo en Perfil (§1.12).
- Sin campos de verificación adicionales (sin correo ni teléfono), por la baja alfabetización digital del usuario objetivo.
- Sin barra superior con título: el logo es el encabezado, y el título de la tarjeta ("Ingresar" / "Crear cuenta") aparece una sola vez.
- Los errores se muestran dentro del formulario, en español y en lenguaje del usuario (ver §2.6), no como un aviso que desaparece.

### 1.2 Inicio (cosecha activa)
- Nombre de la cosecha activa (ej. "Primer pasón") y su precio por kilo, con la etiqueta explícita ("Pagas $ 1.200 COP por kilo").
- Acceso directo a "Pesar" (lleva a Cuadrillas).
- Menú ⋮ en la tarjeta de la cosecha (requiere conexión):
  - **Editar cosecha:** nombre y precio por kilo. El precio solo cambia mientras no haya pagos, porque cambiaría lo ya pagado.
  - **Eliminar cosecha:** para una cosecha creada por error. Solo se puede si aún no tiene pesadas ni pagos; si ya los tiene, el mensaje indica que se cierre con "Cerrar cosecha".
- Precio actual publicado por la FNC, con fecha del último dato. **Solo si existe un dato real**; nunca un valor de ejemplo ni "$ 0".
- Indicador de conexión: "En línea" o "Sin conexión · se guarda en el teléfono". Cuando la sincronización offline esté implementada, este indicador pasa a mostrar las pesadas/pagos pendientes de sincronizar. Nunca se muestra "Sincronizado" si no es verdad.
- Botón "Cerrar cosecha" (lleva al flujo de venta y costos).
- Si no hay cosecha activa: invitación a abrir una nueva, con campo de nombre libre.

### 1.3 Cuadrillas
- Lista de cuadrillas de la cosecha activa (nombre + cantidad de recolectores).
- Botón para crear una nueva cuadrilla. El diálogo trae solo el placeholder, sin un nombre escrito.
- Cada cuadrilla se crea desde cero en cada cosecha.
- **Sin cuadrilla:** debajo de las cuadrillas, las personas que vienen a cosechar solas. Usan las mismas tarjetas del detalle de cuadrilla (Pesar, saldo, menú ⋮) y tienen el botón "Agregar persona" (requiere conexión). Este botón abre Agregar recolector en modo "sin cuadrilla".

### 1.4 Detalle de cuadrilla
- Lista de recolectores asignados: iniciales, nombre (o alias, con el nombre real debajo), kilos de hoy y saldo por pagar.
- Botón "Pesar" (ícono + texto) en cada fila; tocar la fila abre el detalle del recolector.
- Menú ⋮ en cada fila (requiere conexión):
  - **Editar nombre:** cambia el "Nombre o alias" en el catálogo.
  - **Cambiar de cuadrilla:** a otra cuadrilla o "Sin cuadrilla".
  - **Eliminar de la cosecha:** solo si no tiene pesadas ni pagos. Si los tiene, se ofrece archivarlo: deja de aparecer para pesar y se conserva lo registrado.
- Botón "Agregar recolector" (requiere conexión), que abre la pantalla **Agregar recolector**:
  - Buscador por nombre o alias sobre el catálogo de trabajadores.
  - Cada trabajador con su situación: disponible (tocar = agregar), "En esta cuadrilla" (inactivo), "En Cuadrilla X" (tocar = confirmar mover; pesadas y pagos se conservan) o "Archivado".
  - "Crear trabajador nuevo": abre el formulario del trabajador y, al guardarlo, queda de una vez en la cuadrilla.

### 1.5 Detalle de recolector (dentro de la cosecha)
- Nombre/alias del recolector.
- Acumulados: hoy, esta semana y toda la cosecha.
- Saldo por pagar (kilos × precio − pagado − alimentación descontada), con lo pagado y la alimentación descontada debajo.
- Botón "Registrar pesada" y lista de pesadas de hoy (las guardadas sin señal aparecen como "Por enviar").
- Botón "Pagar ahora" (requiere conexión; inactivo si no hay saldo). **Solo para quien se va antes de terminar la cogida**; al cerrar la cosecha se le paga a todos (§1.8). El texto de ayuda lo dice. Confirmación en tres pasos:
  1. ¿Le diste alimentación? (sin / con).
  2. Si fue con alimentación: "¿Cuánto cobras de comida por día?". El caficultor cobra un valor fijo por día, y la app cuenta los días con pesadas desde el último pago (en hora de Colombia). Si el último pago fue un día en que ya había pesado, ese día no se vuelve a cobrar.
  3. Desglose y confirmación: kilos y bruto, ya pagado, alimentación anterior, "Alimentación: 3 días × $10.000 = −$30.000" (o "sin días con pesadas desde el último pago") y **monto a pagar**; el botón dice "Pagar $X".
- Solo se paga lo pendiente: los kilos ya pagados no se vuelven a pagar, y la alimentación descontada cuenta como saldada.
- Historial de pagos de esta cosecha (monto en efectivo y alimentación descontada).

### 1.6 Registro de pesada
- Campo numérico de kilos (mayor que 0, máximo 1.000 por pesada).
- Fecha y hora automáticas (las del teléfono al guardar, también si se envía después).
- Confirmación visual al guardar, que distingue: "Pesada guardada" o "Pesada guardada en el teléfono. Se enviará al volver la señal."
- **Sin señal:** la pesada queda en una cola en el teléfono con un id propio, se suma de inmediato a los acumulados en pantalla y se envía sola al recuperar la señal (también al abrir la app). Reenviarla nunca la duplica.
- Si el servidor rechaza una pesada pendiente (ej. el recolector fue archivado), se muestra un aviso con el motivo hasta que el usuario lo descarte.

### 1.7 Catálogo de trabajadores
- Lista global de trabajadores (nombre o alias y teléfono).
- Botón para agregar un nuevo trabajador. El formulario tiene un solo campo, "Nombre o alias" (obligatorio), y "Teléfono (opcional)". Ya no se piden apellido ni alias aparte; los trabajadores antiguos conservan los suyos.
- Los formularios de alta nunca traen valores escritos, solo placeholders. Los de edición muestran los datos actuales.
- Acceso desde aquí para asignarlo a una cuadrilla de la cosecha activa.

### 1.8 Cierre de cosecha
Tres pasos, en el orden que exige el negocio (la venta ocurre cuando la cosecha terminó):
1. **Cerrar = pagarle a todos.** El caficultor no entra a pagar uno por uno.
   - Resumen: recolectores, kilos de café cereza y lo ya pagado.
   - **"¿Les diste alimentación?"**: "Sin alimentación" o "Con alimentación". Con alimentación aparece "¿Cuánto cobras de comida por día?", con placeholder. Ese valor se le descuenta **a todos los trabajadores** por cada día que pesaron desde su último pago (en hora de Colombia), igual que en "Pagar ahora". No se puede cerrar sin elegir.
   - **Pago al cerrar** (vista previa): "Se le paga a N trabajadores: $X", con la comida descontada y "Ver por trabajador" (kilos, días de comida y neto). La comida nunca deja el neto en negativo: si cubre todo lo pendiente, el neto es $0.
   - Confirmación con el monto: "Se registra el pago de todos los trabajadores: $X… Ya no podrás registrar pesadas ni pagos". Al cerrar se guarda un pago de **liquidación** por recolector (activos y archivados) junto con el cierre, en una sola operación.
2. **Venta**: kilos secos vendidos, precio por kilo seco y fecha, con la proyección de kilos secos (cereza ÷ 5) como referencia y el total de la venta.
   - La **fecha se elige sin escribir**, con tres botones grandes: **Hoy**, **Ayer** y **Otro día**. "Otro día" abre un calendario en español, en una hoja inferior, con "Listo" y "Cancelar"; no deja elegir días futuros.
   - Nada viene marcado. Al elegir, se confirma la fecha en palabras ("✓ Sábado, 11 de octubre de 2026"). "Registrar venta" se activa cuando hay fecha.
   - Hoy y Ayer se calculan en hora de Colombia.
3. **Costos**: lista de gastos (descripción + valor) y el resumen: venta − pagos = ganancia bruta − costos = **ganancia de la cosecha** (con esa etiqueta explícita para no confundirla con la rentabilidad de la finca).
- Si el usuario sale a mitad, retoma desde el detalle del historial ("Registrar venta y costos").

### 1.9 Historial de cosechas
- Lista de cosechas cerradas (nombre, fechas, ganancia de la cosecha).
- Acceso al detalle de cada una (recolectores, pagos, venta, costos).
- En el detalle va primero el **"Total de los trabajadores"** (efectivo + comida descontada), con "En efectivo $X · comida $Y". Cada trabajador muestra sus kilos y su total, y al tocarlo se abre su detalle.
- **Detalle del trabajador** (`/harvest/history/:harvestId/pickers/:pickerId`):
  - Total del trabajador, con kilos × precio por kilo.
  - **Kilos por día**: fecha, kilos y valor, con su fila de total.
  - Pagos: "Pago (se fue antes)" o "Liquidación al cerrar", con la fecha y la comida descontada.
  - Resumen: kilos × precio, comida descontada y recibido en efectivo. "Quedó debiendo" solo aparece en cosechas cerradas antes de que el cierre liquidara a todos.

### 1.10 Precio y noticias
- Precio actual del café publicado por la FNC (carga de 125 kg), con fecha. Sin dato: "Aún no hay precio publicado" (nunca "$ 0 COP", que parecería un precio real).
- Bajo el precio, un análisis corto (máx. 3 frases) de cómo está frente a los registros anteriores, con la etiqueta "Generado con IA · Gemini". Nunca recomienda vender o guardar ni da pronósticos. Solo aparece si corresponde al precio vigente.
- **Noticias del café**: medio, fecha, titular y "Leer en {medio}", que abre la nota original. Sin resumen: la fuente no trae texto y no se inventa uno. Al final: "Noticias de Google Noticias, elegidas con IA para caficultores."
- Estado vacío honesto ("Se actualizan cada mañana"). Pull-to-refresh recarga todo.
- Sin señal se muestra lo último guardado, con el aviso "Sin conexión · mostrando lo último guardado".

**Cómo se obtienen (backend, todo gratis):**
- **Precio:** se lee de la página de la FNC (`FNC_PRICE_URL`, por defecto `https://federaciondecafeteros.org/wp/`). Se guarda si está entre 500.000 y 6.000.000 COP y es de los últimos 3 días, con el mismo flujo que crea las notificaciones de cambio de precio.
- **Noticias:** RSS de Google Noticias ("café Colombia caficultores", últimos 14 días). Se descartan las repetidas y las de más de 30 días; Gemini elige las 8 más útiles para un caficultor a partir de los titulares y, si falla, se toman las más recientes.
- **Análisis:** Gemini (`GEMINI_MODEL`, por defecto `gemini-3.8-flash`) en el plan gratuito, solo con el historial de precios.
- **Gemini nunca usa la búsqueda en Google** (exige facturación). Sin facturación activa, pasarse del límite gratuito responde 429 y no cobra. Sin `GEMINI_API_KEY`, el precio y las noticias igual se actualizan; solo no hay análisis.
- **Cuándo:** un workflow de GitHub Actions (`.github/workflows/coffee-intel.yml`, 7:00 a. m. de Colombia) llama a `POST /price-and-news/ai/refresh`; como respaldo, si los datos tienen más de 24 h, se refrescan en segundo plano al leerlos (en el plan free de Render el servidor se duerme).
- **Descartado por no poder hacerse gratis y con fuente real:** tips agronómicos del mes y resumen de cada noticia.

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
│   ├── Etiqueta de estado (activa / cerrada / archivado; "En línea" / "Sin conexión"). Informativa, no parece botón
│   ├── Icono (recolector, cuadrilla, balanza, pago, venta, precio, noticia, notificación)
│   ├── Avatar / foto de perfil (solo en Perfil)
│   ├── Logo (encabezado de Login/Registro) e ícono de la app (grano de café)
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
│   ├── Template de formulario (texto de ayuda + campos + error + botón de acción) → Abrir cosecha, Registro de pesada, Trabajador, Cambiar contraseña, Cierre de cosecha
│   └── Template de autenticación (logo + tarjeta con formulario + enlace alterno) → Login, Registro
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

Paleta de marca real, tomada del logo (`LOGO.png`) y de la animación de arranque original (`CosechAPP_animado.svg`, ya retirada), reemplazando la paleta provisional del primer borrador:

```
--color-primary: #32591B       /* verde oscuro de marca — texto/botones principales */
--color-primary-muted: #8e716d /* mauve/marrón de marca — línea del logo, acentos, bordes, iconos */
--color-background: #F2EFF2    /* fondo claro de marca */
--color-secondary: #8C694C     /* marrón medio de marca — acentos secundarios, títulos grandes */
--color-surface: #FFFFFF
--color-text: #2B2420          /* texto de cuerpo — no se usa --color-primary-muted aquí (ver nota de contraste) */
--color-border: #D8D2C0
--color-accent-alert: #7A2E22  /* rojo tierra — se mantiene para alertas puntuales, no viene del logo */
```

> **Nota de contraste (obligatoria por el PRD, sección 10 — Accesibilidad):** se verificó el contraste de cada color de marca contra `--color-background` (#F2EFF2) siguiendo WCAG:
> - `#32591B` → contraste **7.1:1** — cumple AAA. Válido para texto de cualquier tamaño y para botones primarios.
> - `#8C694C` → contraste **4.3:1** — cumple AA solo para texto grande (≥18sp o ≥14sp en negrita) o para iconos/bordes; **no usar en texto de cuerpo pequeño**.
> - `#8e716d` → contraste **3.9:1** — no cumple AA ni siquiera para texto grande de forma consistente. Reservar para bordes, iconos decorativos y el trazo del logo, **nunca para texto**.
> - Por eso `--color-text` usa un marrón oscuro propio (#2B2420) en vez de `#8e716d`: mantiene el aire cálido de la marca sin sacrificar legibilidad, algo crítico aquí porque la app se usa a plena luz del sol en el cafetal.

**Paleta de Ionic mapeada a la marca.** Los componentes de Ionic (`color="primary"`, `"danger"`, etc.) no leen los tokens `--color-*`; usan `--ion-color-*`. Sin mapearlos, todos los botones "primary" salen en el azul por defecto de Ionic. En `src/theme/variables.css`:

| Color Ionic | Token de marca | Uso |
|---|---|---|
| `primary` / `success` | `#32591B` | Acciones principales, confirmaciones |
| `secondary` | `#8C694C` | Acentos secundarios |
| `danger` | `#7A2E22` (`--color-accent-alert`) | "Cerrar cosecha", errores |
| `warning` | `#B7791F` | Avisos (sin conexión) |
| `medium` | `#6B625D` | Íconos y texto secundario |
| `light` | `#F2EFF2` | Fondos claros |

No se usan colores escritos a mano en las páginas (ej. el verde `#28a745` o el rojo `#dc3545` de Bootstrap): siempre un token.

**Tema único claro.** No hay modo oscuro: la app se usa a pleno sol, y activar la paleta oscura de Ionic sin tokens oscuros propios mezcla superficies claras y oscuras. Por eso `dark.system.css` no se importa en `global.scss`.

**Marca**
```
Ícono de la app:   saco de café con granos sobre blanco #FFFFFF
                   original: resources/img/icono_original.png (2000×1270, transparente)
                   fuente: resources/icon-only.png, icon-foreground.png, icon-background.png,
                           splash.png, splash-dark.png (derivados del original, cuadrados)
                   generado con: npx @capacitor/assets generate --android --iconBackgroundColor "#FFFFFF"
                   (ic_launcher/ic_launcher_round heredados compuestos aparte sobre blanco)
Logo:              src/assets/brand/logo.png (LOGO.png con fondo transparente)
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

Las fuentes van **empaquetadas en la app** (`src/assets/fonts/*.woff2`, subconjunto latin con tildes y ñ, licencia OFL) para que funcionen sin conexión. Zilla Slab es solo para títulos de pantalla y de tarjeta; botones, campos y todo el texto de UI van en Inter.

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
--radius-md: 12dp       /* bloques internos: avisos, cifras, opciones */
--radius-lg: 16dp       /* tarjetas, filas tocables, hojas inferiores, diálogos */
--radius-full: 999dp    /* botones de acción principal, ej. "Pagar ahora" */
--shadow-card: anillo 1dp rgba(43,36,32,0.06) + 0 1dp 2dp 0.06 + 0 2dp 8dp 0.05
--shadow-raised: anillo 1dp 0.05 + 0 4dp 12dp 0.08 + 0 12dp 32dp 0.08   /* tarjeta de cosecha, precio, hojas */
--color-primary-soft: rgba(50,89,27,0.10)   /* fondo de íconos, avatares y "sin leer" */
--color-surface-muted: rgba(43,36,32,0.04)  /* fila presionada */
--touch-target-min: 48dp  /* mínimo de Material Design en Android — corregido desde el borrador inicial, que usaba 44px (estándar iOS, no aplica aquí) */
```

> **Nota de unidades:** en Android, las dimensiones y espaciados se expresan en **dp** (density-independent pixels), y los tamaños de tipografía en **sp** (scale-independent pixels), para que respeten el ajuste de tamaño de fuente del sistema.
>
> **Implementación:** la app corre en un WebView, donde `dp`/`sp` no existen en CSS. Un `px` de CSS ya equivale a 1 dp (el WebView aplica la densidad de pantalla), así que los tamaños van en `px`, y la tipografía en `rem` para respetar el tamaño de fuente del sistema. Ejemplos: 48dp → `48px`; 16sp → `1rem`.
>
> **Área táctil:** los 48dp mínimos aplican al control (botón, chip, enlace), **no al ícono**. Un `ion-icon` decorativo con 48px mínimo descuadra filas, campos y botones.

### 2.3 Especificaciones pixel-perfect por componente

Medidas exactas listas para implementación, siguiendo la grilla base de 4dp:

| Componente | Alto | Padding interno | Radio | Ícono |
|---|---|---|---|---|
| Botón primario | 48dp | 24dp horizontal | 24dp (pill) | 20dp si lleva ícono |
| Botón de ícono ("+") | 48dp × 48dp | — | 24dp (circular) | 24dp |
| Input de texto/numérico | 48dp mínimo, con borde (outline) y etiqueta siempre visible encima (no flotante) | 16dp horizontal | 8dp | — |
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

### 2.6 Patrones de pantalla

Reglas que se repiten en todas las pantallas. Si una pantalla nueva no encaja en ninguna, se agrega el patrón aquí antes de construirla.

**Encabezado**
- **Nivel 1 (pestañas: Inicio, Precio y Noticias, Historial, Perfil):** barra superior con el título de la pantalla, sin botón de volver.
- **Nivel 2 en adelante:** barra con botón "volver" (`ion-back-button` con ruta de respaldo) y el título.
- **Un solo título por pantalla.** La tarjeta del contenido no repite el título de la barra (antes: "Abrir cosecha" arriba y "Nueva cosecha" en la tarjeta).

**Formulario** (clases globales `.form-page`, `.form-page__intro`, `.form-page__fields`, `.form-error` en `variables.css`)
1. Una línea de ayuda que explica para qué sirve el formulario.
2. Campos con etiqueta visible; los ejemplos van como placeholder ("Ej: 1200") y las reglas como texto de ayuda bajo el campo.
3. Campos numéricos vacíos al empezar: nunca un "0" precargado que hay que borrar.
4. Validación por campo al salir de él, con un mensaje que dice qué hacer ("Escribe el precio por kilo.").
5. Error de envío dentro del formulario, sobre el botón. Se mantiene visible hasta el siguiente intento.
6. Un solo botón principal, con el verbo de la acción ("Abrir cosecha", "Guardar trabajador"), que se desactiva mientras el formulario es inválido.

**Estado vacío**: ícono + título corto + una frase + **una sola** acción. Si la pantalla también tiene un botón de "agregar" en el encabezado, ese botón se oculta mientras la lista está vacía.

**Mensajes de error**: siempre en español y en lenguaje del usuario. Nunca se muestran textos técnicos (URL, código HTTP, mensaje en inglés del backend). El backend devuelve un código de error de dominio (`HarvestAlreadyActiveError`, etc.) y `apiErrorMessage()` (`src/app/shared/utils`) lo traduce; si no lo conoce, usa el mensaje de respaldo de la acción ("No se pudo abrir la cosecha. Intenta de nuevo."). Sin conexión: "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo."

**Confirmación**: aviso breve (toast verde de 2 s) solo para acciones que no cambian de pantalla por sí solas, o antes de volver automáticamente (ej. "Contraseña actualizada.").

**Diálogo**: para crear algo que solo necesita un dato (ej. el nombre de una cuadrilla) se usa un diálogo (`ion-alert`) con el campo ya sugerido ("Cuadrilla 1"), en lugar de una pantalla completa.

**Datos reales o nada**: ninguna pantalla muestra valores de ejemplo como si fueran reales (precios, estados de sincronización, nombres). Si falta el dato, se dice ("Aún no hay precio publicado").

**Sin señal** (componente `app-sync-status`, arriba de las pantallas de campo): "Sin conexión. Puedes seguir registrando pesadas. Datos de las HH:MM", "N pesadas por enviar" y, si alguna fue rechazada, la lista con el motivo. Las acciones que requieren conexión (pagar, abrir/cerrar cosecha, agregar recolectores) se desactivan y dicen "Necesitas conexión para…".

**Carga y vacío**: la primera carga de una lista muestra un esqueleto con la forma de sus filas (`app-list-skeleton`), no un spinner centrado; al refrescar se queda lo que ya se ve. Una lista sin datos usa `app-empty-state`: ícono en un círculo verde suave, título en Zilla Slab, una frase y, si existe, la acción que resuelve el vacío.

### 2.7 Contrato de API

Reglas que comparten la app y el backend (NestJS). Las verifica `backend/test/api.e2e-spec.ts` contra una rama de Neon.

**Datos**
- Estados en minúscula: cosecha `active` / `closed`; recolector `active` / `archived`.
- Montos siempre en positivo (COP), tal como los ve el usuario: lo pagado, los costos, la alimentación. (La base de datos guarda pagos y costos en negativo; la conversión es del backend.)
- Fechas en ISO 8601. "Hoy" y "esta semana" se calculan en hora de Colombia (UTC−5), sin importar la zona del servidor.

**Códigos de estado**

| Código | Cuándo |
|---|---|
| 200 | Lectura o actualización correcta; login; reenvío de una pesada ya guardada (mismo `id`); trabajador movido de cuadrilla |
| 201 | Se creó algo: cuenta, cosecha, cuadrilla, trabajador, recolector, pesada, pago, venta, costo |
| 204 | Sin contenido: borrar, cambiar contraseña, o una consulta sin dato (sin cosecha activa, sin venta, sin precio FNC) |
| 207 | Sincronización de pesadas donde alguna falló (cada una trae su propio código) |
| 400 | Datos inválidos (validación) |
| 401 | Sin sesión o sesión vencida (la app vuelve a Login) |
| 403 | Falta la clave de administrador (publicar el precio FNC, refrescar con IA) |
| 404 | No existe **o es de otro usuario** (no se revela que exista) |
| 409 | Conflicto con el estado actual: cosecha activa, cédula repetida, venta ya registrada, trabajador con historial, `id` de pesada reutilizado con otros datos, eliminar una cosecha o un recolector con pesadas/pagos, cambiar el precio de una cosecha con pagos |
| 422 | Regla de negocio: nada pendiente por pagar, alimentación mayor que el saldo, cosecha cerrada, contraseña actual incorrecta |
| 429 | Login: 5 intentos fallidos seguidos con la misma cédula la bloquean 15 minutos (`TooManyLoginAttemptsError`, cabecera `Retry-After` y `retryAfterMinutes` en el cuerpo). Un ingreso correcto reinicia la cuenta |
| 500 / 503 | Falla del servidor / base de datos caída (`GET /health`) |

**Cosecha y recolectores** (`/harvests`, JWT): correcciones agregadas el 2026-10-11

| Método y ruta | Respuesta |
|---|---|
| `PATCH /:id` `{ name?, pricePerKilogram? }` | Cosecha actualizada. 409 si está cerrada o si se cambia el precio con pagos (`HarvestHasPaymentsError`) |
| `DELETE /:id` | 204. 409 `HarvestHasRecordsError` si tiene pesadas o pagos (se cierra en su lugar) |
| `POST /:id/pickers` `{ workerId, crewId? }` | Sin `crewId`, la persona queda sin cuadrilla |
| `PATCH /:id/pickers/:pickerId` `{ crewId?: string \| null, harvestAlias?: string \| null }` | Mueve de cuadrilla (`null` = sin cuadrilla) o quita el alias de la cosecha |
| `DELETE /:id/pickers/:pickerId` | 204. 409 `PickerHasRecordsError` si tiene pesadas o pagos (se archiva en su lugar) |

**Cierre y detalle del trabajador:**
- `GET /harvests/:id/close-preview?includesMeals=&mealPerDay=` devuelve, por recolector con saldo, `{ harvestPickerId, displayName, totalKilograms, gross, alreadyPaid, pending, mealDays, mealDeduction, net }` y los totales `{ settledPickers, totalNet, totalMeals }`.
- `PATCH /harvests/:id/close` recibe `{ includesMeals, mealPerDay? }` y devuelve la cosecha cerrada más `settlement`. Sin body liquida sin comida, para las apps anteriores.
- `GET /harvests/:id/pickers/:pickerId/statement` devuelve los kilos por día, los pagos (con `isSettlement`) y los totales.
- Los pagos traen `isSettlement` (columna `payments.is_settlement`).

**Pagos:** `GET /payments/picker/:id/preview` y `POST /payments/pay-now` reciben `mealPerDay` (COP por día). El desglose trae `mealDays`, `mealPerDay` y `mealDeduction = mealDays × mealPerDay`. `mealDeduction` (valor total) se sigue aceptando para las apps anteriores. **Trabajadores:** `lastName` es opcional.

**Precio y noticias** (`/price-and-news`, JWT salvo los de sistema)

| Método y ruta | Respuesta |
|---|---|
| `GET /coffee-price` | Último precio FNC `{ id, value, queryDate, createdAt }` o 204 |
| `GET /coffee-price/history` | Precios publicados, del más nuevo al más viejo (cada cambio es una fila) |
| `GET /coffee-price/analysis` | `{ text, generatedAt, basedOnPriceId }` del precio vigente, o 204 si aún no se analizó |
| `GET /news` | Noticias de los últimos 30 días: `[{ id, kind: 'NEWS', title, source, summary, url, publishedAt }]` (`summary` vacío) |
| `POST /coffee-price` | Sistema (`x-admin-key`): publica un precio a mano |
| `POST /ai/refresh` | Sistema (`x-admin-key`): precio (web FNC), noticias (Google Noticias) y análisis (Gemini gratis); devuelve `{ aiEnabled, price, news, analysis }` |

**Errores**: `{ statusCode, error, message }`. `error` es el código de dominio (ej. `HarvestAlreadyActiveError`), que la app traduce al español con `apiErrorMessage()`; `message` está en inglés y nunca se muestra al usuario. Un 401 en cambiar contraseña cerraría la sesión, por eso "contraseña actual incorrecta" es 422.

---

### 2.8 Movimiento e interacción
Basado en las skills de Emil Kowalski (`.claude/skills/emil-design-eng`, `mobile-native`). El movimiento sirve para dar feedback, explicar un cambio de estado o evitar saltos; nunca es decoración en algo que se usa muchas veces al día.

**Tokens** (`src/theme/variables.css`)
```
--ease-out: cubic-bezier(0.23, 1, 0.32, 1)     /* lo que entra o sale */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1) /* lo que se mueve dentro de la pantalla */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)  /* hojas inferiores */
--dur-press: 140ms   /* feedback al presionar */
--dur-fast: 180ms    /* colores, foco, salidas */
--dur-base: 240ms    /* entradas de páginas, listas y avisos */
```

**Reglas**
- Nunca `ease-in` ni `transition: all`. Toda animación de interfaz dura menos de 300 ms; la salida es más rápida que la entrada.
- Solo se anima `transform` y `opacity` (y colores en cambios de estado).
- **Al presionar**: los botones se hunden a `scale(0.97)`, las tarjetas y filas tocables (`.tappable`) a `0.98`, las filas de lista a `0.99`. El feedback aparece al tocar, no al soltar.
- **Páginas** (`core/animations/nav.animation.ts`): la nueva sube 12dp y aparece en 240 ms; al volver, la que se va baja y se desvanece en 180 ms.
- **Listas** (`.stagger-in`): en la primera carga los primeros 6 ítems entran escalonados cada 40 ms. Nunca al refrescar, al volver a la pantalla ni en búsquedas.
- **Pestañas**: el ícono activo pasa de contorno a relleno, con transición de color.
- **Háptica**: vibración corta solo al guardar una pesada y al cerrar la cosecha (`hapticSuccess`).
- **Movimiento reducido** (ajuste del sistema): se quitan desplazamientos y escalas; quedan los fundidos.

**Sensación nativa** (base global)
- Sin resaltado gris al tocar, sin rebote de la página entera (`overscroll-behavior: none`) y sin selección de texto en controles con toque largo (el contenido sí se puede copiar).
- `touch-action: manipulation` en controles: el toque responde sin la espera del doble toque.
- Barra de estado blanca con íconos oscuros (plugin `StatusBar`), igual al header.
- Teclado correcto por campo: `inputmode` (numérico o decimal), `enterkeyhint` (siguiente, listo, ir) y `autocapitalize` en nombres.
- Cifras con `font-variant-numeric: tabular-nums` (clase `.num`) para que kilos y montos no se muevan al cambiar.

## 3. Navegación

### 3.1 Estructura de navegación

Navegación principal por barra inferior de pestañas (patrón estándar en apps Android), con 4 accesos directos y flujos de profundización (drill-down) dentro de cada uno:

```
Splash (logo nativo mientras se verifica la sesión)
   │ (la app consulta al backend si hay una sesión válida)
   ├── Sesión válida ──────────────┐
   │                               ▼
   └── Sin sesión / expirada       Dashboard (Inicio)
       ▼
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
1. **Nivel -1 — Splash:** logo nativo (ícono sobre blanco) mientras se verifica la sesión contra el backend (ver §1.0).
2. **Nivel 0 — Autenticación:** Login/Registro (fuera de la barra de pestañas), solo si no hay sesión válida.
3. **Nivel 1 — Pestañas principales:** Inicio, Precio y Noticias, Historial, Perfil.
4. **Nivel 2 — Listas:** Cuadrillas, Catálogo de trabajadores, lista de cosechas cerradas.
5. **Nivel 3 — Detalle:** Detalle de cuadrilla, Detalle de cosecha cerrada.
6. **Nivel 4 — Acción puntual:** Detalle de recolector, Registro de pesada, Pagar ahora, Cierre de cosecha (venta y costos).

> **Nota sobre el timeout de sesión:** como el timeout se maneja en el backend (decisión ya confirmada), el frontend no calcula expiración por su cuenta. En el Splash, la app hace una llamada autenticada (con el token guardado) a un endpoint del backend (ej. `GET /auth/me`); si responde 200, va a Inicio, si responde 401 (sesión expirada o inválida), va a Login con el aviso "Tu sesión expiró. Ingresa de nuevo.". **Sin conexión** (el backend no responde), la sesión se conserva y la app va a Inicio: la app debe funcionar en el cafetal sin señal, y no poder verificar la sesión no significa que haya vencido. El frontend solo reacciona a la respuesta del backend, nunca decide por sí mismo que la sesión venció.

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
