# Design System — CosechApp

Taller de Design System aplicado a **CosechApp**, la app móvil de recolección y pagos para caficultores definida en el PRD del proyecto. Este documento cubre los tres puntos de entrega: Contenido, Jerarquía del contenido y Navegación, apoyándose en la jerarquía de componentes (átomos, moléculas, organismos, templates, páginas) y en los Design Tokens que sostienen la consistencia visual del sistema.

---

## 1. Contenido

Define qué información y elementos se muestran en cada pantalla de CosechApp, con base en las funcionalidades ya definidas en el PRD.

### 1.0 Splash
Arranque en dos tiempos, sin saltos visuales entre uno y otro:
1. **Splash nativo** (Android): ícono de la app (grano de café) sobre fondo blanco `#FFFFFF`. Lo muestra el sistema desde el primer instante, mientras carga el WebView. Configurado en `capacitor.config.ts` (`SplashScreen`, `launchAutoHide: false`) y en `styles.xml` (`windowSplashScreenBackground` blanco, también con el teléfono en modo oscuro).
2. **Animación de marca** (`resources/img/CosechAPP_animado.svg`, copia optimizada en `src/assets/brand/cosechapp-animado.svg`): taza + logotipo que aparece de izquierda a derecha (animación SMIL de 2,9 s). Se muestra a pantalla completa con `object-fit: cover`. El SVG arranca en blanco, así que el relevo desde el splash nativo no se nota.
- Sin controles ni texto interactivo: es una pantalla de transición, no requiere acción del usuario.
- Duración: lo que tarde **lo más largo** entre la animación (~3,3 s) y la verificación de sesión (ver sección 3.1). Si el SVG no carga en 2 s, se sigue sin esperar la animación.

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
- Precio actual publicado por la FNC, con fecha del último dato. **Solo si existe un dato real**; nunca un valor de ejemplo ni "$ 0".
- Indicador de conexión: "En línea" o "Sin conexión · se guarda en el teléfono". Cuando la sincronización offline esté implementada, este indicador pasa a mostrar las pesadas/pagos pendientes de sincronizar. Nunca se muestra "Sincronizado" si no es verdad.
- Botón "Cerrar cosecha" (lleva al flujo de venta y costos).
- Si no hay cosecha activa: invitación a abrir una nueva, con campo de nombre libre.

### 1.3 Cuadrillas
- Lista de cuadrillas de la cosecha activa (nombre + cantidad de recolectores).
- Botón para crear una nueva cuadrilla.
- Cada cuadrilla se crea desde cero en cada cosecha.

### 1.4 Detalle de cuadrilla
- Lista de recolectores asignados: iniciales, nombre (o alias, con el nombre real debajo), kilos de hoy y saldo por pagar.
- Botón "Pesar" (ícono + texto) en cada fila; tocar la fila abre el detalle del recolector.
- Botón "Agregar recolector" (requiere conexión), que abre la pantalla **Agregar recolector**:
  - Buscador por nombre o alias sobre el catálogo de trabajadores.
  - Cada trabajador con su situación: disponible (tocar = agregar), "En esta cuadrilla" (inactivo), "En Cuadrilla X" (tocar = confirmar mover; pesadas y pagos se conservan) o "Archivado".
  - "Crear trabajador nuevo": abre el formulario del trabajador y, al guardarlo, queda de una vez en la cuadrilla.

### 1.5 Detalle de recolector (dentro de la cosecha)
- Nombre/alias del recolector.
- Acumulados: hoy, esta semana y toda la cosecha.
- Saldo por pagar (kilos × precio − pagado − alimentación descontada), con lo pagado y la alimentación descontada debajo.
- Botón "Registrar pesada" y lista de pesadas de hoy (las guardadas sin señal aparecen como "Por enviar").
- Botón "Pagar ahora" (requiere conexión; inactivo si no hay saldo). Confirmación en tres pasos:
  1. ¿Le diste alimentación? (sin / con).
  2. Si fue con alimentación: valor a descontar en este pago.
  3. Desglose y confirmación: kilos y bruto, ya pagado, alimentación anterior, alimentación de este pago y **monto a pagar**; el botón dice "Pagar $X".
- Solo se paga lo pendiente: los kilos ya pagados no se vuelven a pagar, y la alimentación descontada cuenta como saldada.
- Historial de pagos de esta cosecha (monto en efectivo y alimentación descontada).

### 1.6 Registro de pesada
- Campo numérico de kilos (mayor que 0, máximo 1.000 por pesada).
- Fecha y hora automáticas (las del teléfono al guardar, también si se envía después).
- Confirmación visual al guardar, que distingue: "Pesada guardada" o "Pesada guardada en el teléfono. Se enviará al volver la señal."
- **Sin señal:** la pesada queda en una cola en el teléfono con un id propio, se suma de inmediato a los acumulados en pantalla y se envía sola al recuperar la señal (también al abrir la app). Reenviarla nunca la duplica.
- Si el servidor rechaza una pesada pendiente (ej. el recolector fue archivado), se muestra un aviso con el motivo hasta que el usuario lo descarte.

### 1.7 Catálogo de trabajadores
- Lista global de trabajadores (nombre, apellido, alias, teléfono).
- Botón para agregar un nuevo trabajador.
- Acceso desde aquí para asignarlo a una cuadrilla de la cosecha activa.

### 1.8 Cierre de cosecha
Tres pasos, en el orden que exige el negocio (la venta ocurre cuando la cosecha terminó):
1. **Cerrar**: resumen (recolectores, kilos de café cereza, pagado). Si quedan saldos pendientes, aviso con el total. Confirmación: "Ya no podrás registrar pesadas ni pagos".
2. **Venta**: kilos secos vendidos, precio por kilo seco y fecha (por defecto hoy), con la proyección de kilos secos (cereza ÷ 5) como referencia y el total de la venta.
3. **Costos**: lista de gastos (descripción + valor) y el resumen: venta − pagos = ganancia bruta − costos = **ganancia de la cosecha** (con esa etiqueta explícita para no confundirla con la rentabilidad de la finca).
- Si el usuario sale a mitad, retoma desde el detalle del historial ("Registrar venta y costos").

### 1.9 Historial de cosechas
- Lista de cosechas cerradas (nombre, fechas, ganancia de la cosecha).
- Acceso al detalle de cada una (recolectores, pagos, venta, costos).

### 1.10 Precio y noticias
- Precio actual del café publicado por la FNC, con fecha. Sin dato: "Aún no hay precio publicado" (nunca "$ 0 COP", que parecería un precio real).
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

Paleta de marca real, tomada del logo (`LOGO.png`) y de la animación de arranque (`CosechAPP_animado.svg`), reemplazando la paleta provisional del primer borrador:

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
Ícono de la app:   grano de café del logo, color #873C18 (el óxido de la taza del splash) sobre #F2EFF2
                   fuente: resources/icon-only.png, icon-foreground.png, icon-background.png
                   generado con: npx @capacitor/assets generate --android
Logo:              src/assets/brand/logo.png (LOGO.png con fondo transparente)
Animación splash:  src/assets/brand/cosechapp-animado.svg (optimizado con svgo, 1,5 MB)
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
--radius-md: 12dp       /* tarjetas de recolector y cuadrilla */
--radius-full: 999dp    /* botones de acción principal, ej. "Pagar ahora" */
--shadow-card: 0 1dp 3dp rgba(43,36,32,0.12)
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
| 403 | Falta la clave de administrador (publicar el precio FNC) |
| 404 | No existe **o es de otro usuario** (no se revela que exista) |
| 409 | Conflicto con el estado actual: cosecha activa, cédula repetida, venta ya registrada, trabajador con historial, `id` de pesada reutilizado con otros datos |
| 422 | Regla de negocio: nada pendiente por pagar, alimentación mayor que el saldo, cosecha cerrada, contraseña actual incorrecta |
| 500 / 503 | Falla del servidor / base de datos caída (`GET /health`) |

**Errores**: `{ statusCode, error, message }`. `error` es el código de dominio (ej. `HarvestAlreadyActiveError`), que la app traduce al español con `apiErrorMessage()`; `message` está en inglés y nunca se muestra al usuario. Un 401 en cambiar contraseña cerraría la sesión, por eso "contraseña actual incorrecta" es 422.

---

## 3. Navegación

### 3.1 Estructura de navegación

Navegación principal por barra inferior de pestañas (patrón estándar en apps Android), con 4 accesos directos y flujos de profundización (drill-down) dentro de cada uno:

```
Splash (ícono nativo → animación CosechAPP_animado.svg)
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
1. **Nivel -1 — Splash:** ícono nativo y luego la animación de marca (`CosechAPP_animado.svg`), mientras se verifica la sesión contra el backend (ver §1.0).
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
