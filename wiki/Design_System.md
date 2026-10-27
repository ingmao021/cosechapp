# Design System — CosechApp

Taller de Design System aplicado a **CosechApp**, la app móvil de recolección y pagos para caficultores definida en el PRD del proyecto. Este documento cubre los tres puntos de entrega: Contenido, Jerarquía del contenido y Navegación, apoyándose en la jerarquía de componentes (átomos, moléculas, organismos, templates, páginas) y en los Design Tokens que sostienen la consistencia visual del sistema.

---

## 1. Contenido

Define qué información y elementos se muestran en cada pantalla de CosechApp, con base en las funcionalidades ya definidas en el PRD.

### 1.0 Splash
Arranque animado mientras se verifica la sesión:
1. **Splash nativo** (Android): un instante en blanco `#FFFFFF` mientras carga el WebView. Configurado en `capacitor.config.ts` (`SplashScreen`, `launchAutoHide: false`) y en `styles.xml` (`windowSplashScreenBackground` blanco, también con el teléfono en modo oscuro).
2. **`SplashPage`:** oculta el nativo y muestra el fondo de café (`splash-bg.webp`). Arriba aparecen el nombre "CosechApp" (Zilla Slab) y tres granos que laten mientras carga. Abajo, apoyado en el borde de la pantalla como un retrato, **el campesino de la marca sube serio** (`farmer-serious.webp`) y, mientras carga, **sonríe** (`farmer-smile.webp` se funde encima) con un leve asentimiento y un halo verde suave detrás. Las dos caras son la misma ilustración; la seria solo cambia la boca (labios cerrados). Con movimiento reducido aparece directamente sonriendo, con un fundido.
- Sin controles ni texto interactivo: es una pantalla de transición, no requiere acción del usuario.
- Duración: lo que tarde **lo más largo** entre 2 s (para que se vea la sonrisa) y la verificación de sesión (ver sección 3.1). Sale con un fundido de 250 ms hacia Login o Inicio.

### 1.1 Login / Registro
**Login:**
- Arriba, dos botones circulares (`AuthTopBarComponent`): a la izquierda "volver", que **cierra la app** (Login es la primera pantalla); a la derecha el **estado de la conexión**: rayo blanco sobre verde oscuro = con señal, rayo tachado en rojo tierra sobre blanco = sin señal. El estado también cambia el nombre accesible ("Con conexión" / "Sin conexión") y al tocarlo un aviso explica qué implica.
- Hero con las ramas de café del arranque sobre un velo verde claro, el saco, el wordmark en Zilla Slab y una frase corta de propósito.
- Tarjeta blanca (radio 28dp) con el título "Ingresar", campo cédula (ícono de documento, teclado numérico) y campo contraseña (ícono de candado, botón mostrar/ocultar).
- Botón "Ingresar →" y enlace "Crear cuenta".

**Registro:** los mismos campos más "Confirmar contraseña", con la regla de la contraseña visible como texto de ayuda ("Mínimo 6 caracteres"). Su botón "volver" regresa a Login (no cierra la app).

**Reglas para ambas pantallas:**
- **Sin foto de perfil.** Una foto "opcional" en el formulario de entrada distrae y no aporta nada para ingresar; la foto vive solo en Perfil (§1.12).
- Sin campos de verificación adicionales (sin correo ni teléfono), por la baja alfabetización digital del usuario objetivo.
- Sin barra superior con título: el logo es el encabezado, y el título de la tarjeta ("Ingresar" / "Crear cuenta") aparece una sola vez.
- Los errores se muestran dentro del formulario, en español y en lenguaje del usuario (ver §2.6), no como un aviso que desaparece.

### 1.2 Inicio (dashboard de la cosecha activa)
Inicio **solo informa**: no tiene formularios ni acciones sobre la cosecha (abrir, editar, eliminar y cerrar viven en Crear, §1.2.1). Los botones que tiene solo llevan a otra pantalla.
- Arriba, una franja del día (tile tocable que lleva a Mercado): la fecha de hoy en hora de Colombia ("Sáb 24 oct") y el precio FNC, cada uno con su chip de ícono. Sin precio publicado dice "Sin publicar"; **nunca** un valor de ejemplo ni "$ 0".
- Debajo, de arriba hacia abajo: el bloque principal en verde y el resto en tarjetas blancas con su nombre encima (`.section-title`):
  1. **Bloque principal (cosecha activa y kilos de hoy frente a ayer)** — el elemento firma de la app. Es la única tarjeta en color: verde hoja profundo (`--color-leaf-deep`, texto blanco 8,4:1) con el dibujo de ramas de café del splash y del login, invertido y muy suave, que se desvanece hacia la izquierda para que el texto quede sobre verde limpio. Lleva "Cosecha activa · Día N" (N = 1 el día que se abrió, en hora de Colombia), el nombre, **los kilos de hoy en grande** en Zilla Slab ("157,3 kg hoy"; incluyen las pesadas guardadas sin señal), una píldora con la diferencia en palabras ("49,7 kg menos que ayer", "Igual que ayer"; el primer día, "Primer día de la cosecha") y "Ayer: 207 kg", el estado de envío ("En línea", "Sin conexión · se guarda en el teléfono", "N pesadas por enviar" en ámbar claro; nunca "Sincronizado" si no es verdad) y el botón blanco **"Continuar"**, que lleva a Cuadrillas.
  2. **Pagos pendientes:** total por pagar en Zilla Slab verde oscuro y hasta 5 recolectores con saldo (el mayor primero), cada uno con su atajo **"Pagar ahora"**, un botón tonal (verde suave, sin borde, 44dp) que abre su detalle con el flujo de pago ya en marcha (§1.5). Si hay más, "y N más". Requiere conexión. Sin saldos: "Nada pendiente: todos están al día".
  3. **Acumulado de la cosecha:** cuatro celdas blancas con ícono, cifra en Zilla Slab y nombre: kilos recogidos, pagado, por pagar y costos ("—" con "se registran al cerrar" mientras no haya). Con letra grande la cuadrícula pasa a una columna (ancho mínimo en `rem`), nunca parte un monto.
  4. **Valor y ganancia · estimados:** solo resultados, sin fórmulas: cinco renglones nombre → cifra en el orden en que se calculan (valor de lo recogido, pagos a recolectores, **ganancia bruta**, costos de producción y **ganancia de la cosecha** en Zilla Slab; PRD 7.7 a 7.9), con una raya antes de cada ganancia. El valor se estima con el precio FNC de hoy (kilos secos proyectados = cereza ÷ 5; el precio FNC es por carga de 125 kg) y los pagos incluyen lo pagado y lo que falta por pagar, porque al cerrar se liquida todo. Es estimada: con la cosecha abierta no hay venta. Sin precio FNC dice "Sin precio FNC" y las ganancias "—", nunca una cifra inventada. La ganancia de la cosecha va en verde solo si es ganancia; $ 0 en color neutro y una pérdida en rojo tierra, como en el historial. Si con letra grande nombre y cifra no caben, la cifra baja a su propia línea.
  5. **Kilos por día (últimos 7 días):** arriba, una frase que resume la semana ("783,9 kg en 7 días" · "Mejor día: vie, 242,7 kg"); debajo, columnas finas (`app-daily-kilos-chart`). Hoy en el verde de marca y los demás días en un paso más claro del mismo verde; cifra solo sobre hoy y el día más alto (tocar una columna muestra la suya). Los días antes de abrir la cosecha no tienen columna, y los días sin pesadas una marca gris mínima. El lector de pantalla recibe todas las cifras. Si no hubo pesadas en esos 7 días, en vez del gráfico vacío dice "Aún no hay pesadas en los últimos 7 días."
  6. **Actividad reciente:** las últimas 6 pesadas y pagos, agrupados por día con una cabecera pequeña ("Hoy", "Ayer", "Lun 20 oct"); cada fila lleva "Pesada · 10:32", "Pago" o "Liquidación" y su cifra. Las pesadas con chip verde y balanza, los pagos con chip café (`--color-coffee-chip`) y billete: se distinguen por ícono, no solo por color. Las que siguen en el teléfono dicen "Por enviar". Tocar una fila abre al recolector.
- Se refresca al volver a la pestaña y con deslizar hacia abajo. Sin señal muestra la última copia guardada.
- Si no hay cosecha activa: el costal de la marca (`splash-sack.webp`), "No hay cosecha activa" y un solo botón, "Ir a Crear".

### 1.2.1 Crear (sección de la barra inferior, `/create`)
- Página de nivel 1 con el título "Crear".
- **Sin cosecha activa:** el formulario para abrirla (nombre libre y precio por kilo, §2.6 Formulario). Al abrirla se va a Inicio.
- **Con cosecha activa:** su estado (nombre, día N, fecha de apertura, precio por kilo, kilos y recolectores), el aviso "Solo puede haber una cosecha abierta a la vez. Para abrir otra, cierra esta…" y las acciones de su ciclo de vida:
  - **"Ir a la cosecha"** (lleva a Cuadrillas).
  - Menú ⋮ (requiere conexión): **Editar cosecha** (nombre y precio por kilo; el precio solo cambia mientras no haya pagos, porque cambiaría lo ya pagado) y **Eliminar cosecha** (para una cosecha creada por error; solo si aún no tiene pesadas ni pagos; si ya los tiene, el mensaje indica que se cierre con "Cerrar cosecha").
  - **"Cerrar cosecha"** (texto rojo, requiere conexión; lleva al flujo de §1.8). Sin kilos pesados, un diálogo lo explica (§2.6 Acción bloqueada).

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
│   ├── Estado de la cosecha activa (Crear: nombre + día + precio/kilo + ⋮ + cerrar cosecha)
│   ├── Bloques del dashboard de Inicio (pagos pendientes, acumulado, kilos por día, actividad reciente)
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
    ├── Inicio (dashboard de la cosecha activa)
    ├── Crear (abrir cosecha / cosecha abierta)
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
--color-primary: #79A636       /* verde hoja de marca — rellenos: botones, botón Crear, insignias */
--color-primary-ink: #4F6E22   /* el primario oscurecido — texto e iconos verdes sobre fondos claros */
--color-text-on-primary: #1F2E0E /* verde casi negro — texto e iconos sobre rellenos verdes */
--color-primary-muted: #8e716d /* mauve/marrón de marca — línea del logo, acentos, bordes, iconos */
--color-background: #F2EFF2    /* fondo claro de marca */
--color-secondary: #88AD49     /* verde claro — acentos decorativos e iconos grandes */
--color-surface: #FFFFFF
--color-text: #2B2420          /* texto de cuerpo — no se usa --color-primary-muted aquí (ver nota de contraste) */
--color-border: #D8D2C0
--color-accent-alert: #7A2E22  /* rojo tierra — se mantiene para alertas puntuales, no viene del logo */
--color-leaf-deep: #3B551A     /* verde hoja profundo — fondo del bloque principal de Inicio (blanco encima: 8.4:1) */
--color-on-leaf: #FFFFFF       /* texto y cifras sobre verde hoja profundo */
--color-on-leaf-muted: rgba(255,255,255,.78) /* secundario sobre verde hoja profundo (~5.4:1) */
--color-coffee-chip: #F3EEED   /* chip de los pagos en Actividad reciente; el ícono va en --color-primary-muted */
```

> **Nota de contraste (obligatoria por el PRD, sección 10 — Accesibilidad):** se verificó el contraste de cada color de marca contra `--color-background` (#F2EFF2) siguiendo WCAG:
> - `#79A636` → contraste **2.9:1** sobre blanco — **nunca como texto ni icono sobre fondo claro**. Es un color de relleno; el texto encima va en `#1F2E0E` (**5.0:1**, cumple AA). El blanco sobre este verde solo llega a 2.9:1, por eso no se usa.
> - `#4F6E22` (`--color-primary-ink`) → contraste **5.9:1** sobre blanco — cumple AA. Es el verde para texto, enlaces, iconos y la pestaña activa.
> - `#88AD49` → contraste **2.6:1** sobre blanco — solo decorativo (iconos grandes de estados vacíos, carga del splash); con texto encima, `#1F2E0E` (**5.6:1**).
> - `#8e716d` → contraste **3.9:1** — no cumple AA ni siquiera para texto grande de forma consistente. Reservar para bordes, iconos decorativos y el trazo del logo, **nunca para texto**.
> - Por eso `--color-text` usa un marrón oscuro propio (#2B2420) en vez de `#8e716d`: mantiene el aire cálido de la marca sin sacrificar legibilidad, algo crítico aquí porque la app se usa a plena luz del sol en el cafetal.

**Paleta de Ionic mapeada a la marca.** Los componentes de Ionic (`color="primary"`, `"danger"`, etc.) no leen los tokens `--color-*`; usan `--ion-color-*`. Sin mapearlos, todos los botones "primary" salen en el azul por defecto de Ionic. En `src/theme/variables.css`:

| Color Ionic | Token de marca | Uso |
|---|---|---|
| `primary` / `success` | `#79A636`, contraste `#1F2E0E` | Acciones principales, confirmaciones. Con `fill="clear"`/`"outline"` y en `ion-icon`, el verde pasa a `#4F6E22` (regla global en `variables.css`) |
| `secondary` | `#88AD49`, contraste `#1F2E0E` | Acentos secundarios |
| `danger` | `#7A2E22` (`--color-accent-alert`) | "Cerrar cosecha", errores |
| `warning` | `#B7791F` | Avisos (sin conexión) |
| `medium` | `#6B625D` | Íconos y texto secundario |
| `light` | `#F3F4F1` | Fondos claros |

**Rediseño "OS clean" (2026-10-24).** Fondo agrupado estilo sistema y texto casi negro con tinte verde, en lugar del malva y el marrón del borrador:

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--color-background` | `#F3F4F1` | Fondo de pantalla (gris niebla) | — |
| `--color-text` | `#1D211B` | Texto | 16.4:1 sobre blanco |
| `--color-text-muted` | `#6B6F68` | Secundario y metadatos | 5.1:1 sobre blanco, 4.6:1 sobre el fondo |
| `--color-separator` | `rgba(29,33,27,.08)` | Líneas entre filas | — |
| `--color-pressed` | `rgba(29,33,27,.05)` | Fila presionada | — |
| `--color-chip` | `#EEF4E6` | Fondo de chips de ícono (ícono en `#4F6E22`, 5.2:1) | — |

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
--font-family-body: "Inter" (variable 100–900)  /* toda la interfaz: títulos, cuerpo, botones, campos */
--font-family-display: "Zilla Slab"              /* solo el wordmark y las cifras grandes */
--font-size-xs: 12sp        /* caption: chips, pestañas */
--font-size-footnote: 13sp  /* metadatos */
--font-size-sm: 14sp        /* secundario, etiquetas de campo */
--font-size-md: 16sp        /* cuerpo */
--font-size-headline: 17sp  /* título de fila o tarjeta */
--font-size-lg: 20sp        /* sección */
--font-size-title: 22sp     /* título de página interna */
--font-size-xl: 28sp        /* título de pestaña */
--font-size-figure: 36sp    /* cifra destacada (Zilla) */
--font-weight-regular: 400 · medium: 500 · semibold: 600 · bold: 700
```

Estilo sistema: **una sola familia para la interfaz** (Inter) y la jerarquía la dan el peso y el tamaño, nunca pesos finos. Los títulos grandes llevan tracking negativo (−0.02em a 28sp, −0.01em a 20–22sp), como la fuente del sistema. **Zilla Slab es la firma de la marca**: el wordmark "CosechApp" (login y barra de Inicio) y las cifras que responden la pregunta de la pantalla (kilos de hoy, precio FNC, saldo por pagar, ganancia), como en el cuaderno de registro de la finca. Nunca en títulos ni en texto corrido.

Las fuentes van **empaquetadas en la app** (`src/assets/fonts/*.woff2`, licencia OFL) para que funcionen sin conexión: `InterVariable.woff2` (Inter v4.1 completa, con tamaño óptico automático) y Zilla Slab 400/700 (subconjunto latin con tildes y ñ).

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
--radius-sm: 8dp        /* elementos pequeños */
--radius-md: 14dp       /* campos, celdas del calendario, bloques internos */
--radius-lg: 20dp       /* tarjetas y tiles (estilo sistema, muy redondeado) */
--radius-xl: 28dp       /* hojas inferiores, diálogos, panel de login */
--radius-full: 999dp    /* botones (píldora), chips, segmentados */
--shadow-card: 0 1dp 2dp rgba(29,33,27,.04) + 0 8dp 24dp rgba(29,33,27,.06)   /* sin anillo: la tarjeta se separa del fondo por el blanco */
--shadow-pressed: 0 1dp 2dp .04 + 0 2dp 8dp .04     /* tarjeta presionada: "toca" el fondo */
--shadow-raised: 0 2dp 6dp .06 + 0 16dp 40dp .10    /* panel de login, hojas */
--color-primary-soft: rgba(121,166,54,0.14)  /* tintes verdes suaves */
--color-surface-muted: rgba(29,33,27,0.04)
--icon-chip-size: 40dp · --row-gap: 12dp · --row-min-height: 64dp · --circle-btn-size: 48dp
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
| Botón primario | 52dp | 24dp horizontal | píldora | 20dp si lleva ícono |
| Botón circular (volver, campana, agregar, cerrar) | 48dp × 48dp, blanco con sombra suave | — | circular | 22dp |
| Input de texto/numérico | 52dp mínimo, con borde y etiqueta siempre visible encima, fuera de la caja (no flotante) | 16dp horizontal | 14dp | 22dp si lleva ícono inicial |
| Tarjeta de recolector | 64dp mínimo | 12dp vertical, 16dp horizontal | 20dp | chip de iniciales 40dp |
| Fila de navegación (`app-nav-row`) | 64dp mínimo | 8dp vertical, 16dp horizontal | 20dp | chip 40dp (ícono 20dp) + 12dp hasta el texto |
| Fila de registro (`.group__row`) | 56dp | 8dp vertical, 16dp horizontal | — (la tarjeta lleva el radio) | — |
| Segmentado (`app-segmented`) | 44dp por opción + 4dp de riel | — | píldora | — |
| Celda del calendario | cuadrada, hasta 48dp | — | 14dp | — |
| Chip ("con alimentación") | 28dp | 12dp horizontal | 999dp (pill) | 16dp si lleva ícono |
| Barra de navegación inferior (flotante) | 64dp, a 8dp de los bordes + inset de gestos del sistema; radio 24dp | 4dp horizontal | — | 24dp por pestaña; botón Crear 52dp, sobresale 16dp |
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

Clases globales en `variables.css` (las `.text-level-*` de siempre quedan como alias):

| Nivel | Clase | Tamaño/interlínea | Peso | Ej. |
|---|---|---|---|---|
| 1 · título de pestaña | `.text-level-1` / `.t-large` | 28/34, tracking −0.02em | 700 | "Historial", "Perfil" |
| 1 · título de página interna | (automático en barras con "volver") / `.t-title` | 22/28 | 700 | "Cerrar cosecha" |
| 2 · sección | `.text-level-2` / `.t-section` | 20/25 | 600 | "Noticias del café" |
| Encabezado de grupo | `.section-title` | 17/22 | 600 | "Pesadas de hoy" |
| Título de fila o tarjeta | `.t-headline` | 17/22 | 600 | nombre del recolector |
| 3 · cuerpo | `.text-level-3` / `.t-body` | 16/22 | 400 | párrafos, ayuda |
| 4 · secundario | `.text-level-4` / `.t-subhead` | 14/19, atenuado | 500 | subtítulo de fila |
| Metadatos | `.t-footnote` | 13/18, atenuado | 400 | fecha de una noticia |
| Caption | `.t-caption` | 12/16, atenuado | 600 | etiquetas de pestaña |
| Cifra | `.t-figure` | Zilla Slab 36, `tabular-nums` | 700 | kilos de hoy, ganancia |

Los íconos acompañan siempre al texto (nunca solos) en las acciones principales, dada la prioridad de simplicidad visual para usuarios con baja alfabetización digital.

### 2.6 Patrones de pantalla

Reglas que se repiten en todas las pantallas. Si una pantalla nueva no encaja en ninguna, se agrega el patrón aquí antes de construirla.

**Encabezado** (estilo sistema: la barra es del color del fondo, sin línea ni sombra)
- **Nivel 1 (Inicio, Mercado, Crear, Historial, Perfil):** título grande a la izquierda (28sp), sin botón de volver. En Inicio el título es el wordmark en Zilla Slab.
- **Nivel 2 en adelante:** botón circular "volver" (48dp, blanco con sombra suave) y el título en 22sp. Los botones de ícono del encabezado (campana, agregar) usan el mismo círculo.
- **Un solo título por pantalla.** La tarjeta del contenido no repite el título de la barra (antes: "Abrir cosecha" arriba y "Nueva cosecha" en la tarjeta).

**Formulario** (clases globales `.form-page`, `.form-page__intro`, `.form-page__fields`, `.form-error` en `variables.css`)
1. Una línea de ayuda que explica para qué sirve el formulario.
2. Campos con etiqueta visible; los ejemplos van como placeholder ("Ej: 1200") y las reglas como texto de ayuda bajo el campo.
3. Campos numéricos vacíos al empezar: nunca un "0" precargado que hay que borrar.
   - **Al escribir, sin punto; en los resultados, con punto.** Los montos en pesos (`app-input type="integer"`) solo aceptan dígitos: "18.500" queda "18500" y nunca se toma como 18,5. Los kilos (`type="decimal"`) usan la coma decimal y un punto escrito pasa a coma ("25.5" → "25,5"). Los diálogos con montos (`ion-alert`) usan campo de texto y `parseInteger()`. Donde se muestra el resultado va el punto de miles ("$ 18.500", "1.250 kg").
   - Los totales calculados muestran solo el resultado, sin la fórmula ("Total de la venta: $ 231.250 COP").
4. Validación por campo al salir de él, con un mensaje que dice qué hacer ("Escribe el precio por kilo.").
5. Error de envío dentro del formulario, sobre el botón. Se mantiene visible hasta el siguiente intento.
6. Un solo botón principal, con el verbo de la acción ("Abrir cosecha", "Guardar trabajador"), que se desactiva mientras el formulario es inválido.

**Estado vacío**: ícono + título corto + una frase + **una sola** acción. Si la pantalla también tiene un botón de "agregar" en el encabezado, ese botón se oculta mientras la lista está vacía.

**Mensajes de error**: siempre en español y en lenguaje del usuario. Nunca se muestran textos técnicos (URL, código HTTP, mensaje en inglés del backend). El backend devuelve un código de error de dominio (`HarvestAlreadyActiveError`, etc.) y `apiErrorMessage()` (`src/app/shared/utils`) lo traduce; si no lo conoce, usa el mensaje de respaldo de la acción ("No se pudo abrir la cosecha. Intenta de nuevo."). Sin conexión: "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo."

**Confirmación**: aviso breve (toast verde de 2 s) solo para acciones que no cambian de pantalla por sí solas, o antes de volver automáticamente (ej. "Contraseña actualizada.").

**Diálogo**: para crear algo que solo necesita un dato (ej. el nombre de una cuadrilla) se usa un diálogo (`ion-alert`) con el campo ya sugerido ("Cuadrilla 1"), en lugar de una pantalla completa.

**Datos reales o nada**: ninguna pantalla muestra valores de ejemplo como si fueran reales (precios, estados de sincronización, nombres). Si falta el dato, se dice ("Aún no hay precio publicado").

**Sin señal** (componente `app-sync-status`, arriba de las pantallas de campo): "Sin conexión. Puedes seguir registrando pesadas. Datos de las HH:MM", "N pesadas por enviar" y, si alguna fue rechazada, la lista con el motivo. Las acciones que requieren conexión (pagar, abrir/cerrar cosecha, agregar recolectores) se desactivan y dicen "Necesitas conexión para…".

**Acción bloqueada**: cuando algo todavía no se puede hacer, se dice por qué y cuál es el paso siguiente. Al tocar "Cerrar cosecha" sin kilos pesados aparece un diálogo ("Aún no hay kilos pesados", con "Ir a pesar"); si se llega a la pantalla de cierre por otro camino, el paso queda reemplazado por un aviso `.notice` (tinte cálido de advertencia, ícono, título, motivo y acción) y no se puede cerrar.

**Carga y vacío**: la primera carga de una lista muestra un esqueleto con la forma de sus filas (`app-list-skeleton`), no un spinner centrado; al refrescar se queda lo que ya se ve. Una lista sin datos usa `app-empty-state`: ícono de línea en verde claro (sin círculo ni recuadro detrás), título en Inter 20/600, una frase y, si existe, la acción que resuelve el vacío.

**Listas: navegación vs. registros** (componentes en `src/app/shared/components/`)
- **Navegación** (cada fila lleva a otra pantalla: ajustes de Perfil, Historial, cuadrillas, trabajadores al agregar): `<button app-nav-row>`, un tile blanco por fila con 8dp entre tiles. Chip circular de 40dp (ícono en verde oscuro sobre `#EEF4E6`, o iniciales para personas y cuadrillas), título 17/600, subtítulo 14 atenuado, dato opcional al final (`nav-row-end`) y chevron. Una fila que ejecuta una acción en vez de navegar (agregar trabajador) va sin chevron (`[chevron]="false"`). Con letra grande en pantalla angosta, el título nunca se parte a mitad de palabra: si el dato final no cabe al lado, baja a una segunda línea alineado a la derecha (el chevron queda fijo y centrado). En listas, los montos van sin " COP" y con el signo pegado a la cifra (`−$ 16.000`), para que nunca se partan.
- **Registros** (pesadas, pagos, costos): una tarjeta `.group` con filas `.group__row` y separadores que empiezan donde empieza el texto (inset), no en el borde. Con chips, `.group--chips` corre el separador hasta 68dp.
- **Lista con deslizar** (catálogo de trabajadores): `ion-list lines="inset"` dentro de una tarjeta, con chip de iniciales.

**Elegir entre pocas opciones**: `app-segmented`, un riel gris en píldora con una pastilla blanca que se desliza a la opción elegida (`role="radiogroup"`, flechas del teclado). Es controlado: la página decide el valor, así una opción puede abrir algo antes de quedar elegida ("Otro día" abre el calendario).

**Elegir una fecha**: `app-month-calendar` en una hoja inferior. Semana desde el lunes, celdas redondeadas, el día elegido relleno en verde, hoy con anillo verde oscuro, días fuera de rango atenuados y desactivados, y un punto bajo los días marcados (ej. "abriste la cosecha"). Al tocar un día se elige y la hoja se cierra. Las fechas viajan como texto `AAAA-MM-DD` en hora de Colombia.

**Chip de estado** (`.pill`): píldora informativa no tocable con ícono y texto (sincronización, sin conexión); en ámbar (`.pill--warn`) cuando hay algo pendiente.

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
| 409 | Conflicto con el estado actual: cosecha activa, cédula repetida, venta ya registrada, trabajador con historial, `id` de pesada reutilizado con otros datos, eliminar una cosecha o un recolector con pesadas/pagos, cambiar el precio de una cosecha con pagos, cerrar una cosecha sin kilos pesados |
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

**Inicio:** `GET /harvests/:id/dashboard` devuelve lo que el dashboard no saca de `GET /:id/pickers`:
- `dailyKilograms`: 7 entradas `{ date: 'AAAA-MM-DD', kilograms }`, de hace 6 días a hoy (hora de Colombia), con 0 los días sin pesadas.
- `recentActivity`: las últimas 10 pesadas y pagos, del más reciente al más antiguo: `{ type: 'weighing', id, pickerId, displayName, kilograms, dateTime }` o `{ type: 'payment', id, pickerId, displayName, amount, mealDeduction, isSettlement, dateTime }`.
- `productionCosts`: total de costos en positivo (0 con la cosecha abierta).

**Cierre y detalle del trabajador:**
- `GET /harvests/:id/close-preview?includesMeals=&mealPerDay=` devuelve, por recolector con saldo, `{ harvestPickerId, displayName, totalKilograms, gross, alreadyPaid, pending, mealDays, mealDeduction, net }` y los totales `{ settledPickers, totalNet, totalMeals }`.
- `PATCH /harvests/:id/close` recibe `{ includesMeals, mealPerDay? }` y devuelve la cosecha cerrada más `settlement`. Sin body liquida sin comida, para las apps anteriores. 409 `HarvestHasNoWeighingsError` si la cosecha no tiene ningún kilo pesado (contando recolectores archivados).
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
--dur-press: 120ms   /* feedback al presionar (entra rápido) */
--dur-release: 200ms /* vuelta al soltar (sale suave) */
--dur-fast: 180ms    /* colores, foco, salidas */
--dur-base: 240ms    /* entradas de páginas, listas, avisos y la pastilla del segmentado */
```

**Reglas**
- Nunca `ease-in` ni `transition: all`. Toda animación de interfaz dura menos de 300 ms; la salida es más rápida que la entrada.
- Solo se anima `transform` y `opacity` (y colores en cambios de estado).
- **Al presionar** (un solo lenguaje de respuesta: hundimiento + oscurecido; la onda "ripple" de Material está apagada en toda la app porque en un estilo de sistema se ve ajena). El feedback aparece al tocar (120 ms) y vuelve suave al soltar (200 ms):

  | Elemento | Al tocar |
  |---|---|
  | Botón píldora | `scale(0.97)` y el relleno se oscurece un paso |
  | Tile o tarjeta (`.tappable`, `app-nav-row`) | `scale(0.98)`, la sombra baja y el chip de ícono se oscurece; el chevron se corre 2dp |
  | Fila de lista (`ion-item[button]`) | `scale(0.99)` y fondo `--color-pressed` |
  | Botón circular | `scale(0.92)` |
  | Celda del calendario / opción del segmentado | `scale(0.92)` / `scale(0.96)` |
- **Páginas** (`core/animations/nav.animation.ts`): la nueva sube 12dp y aparece en 240 ms; al volver, la que se va baja y se desvanece en 180 ms.
- **Listas** (`.stagger-in`): en la primera carga los primeros 6 ítems entran escalonados cada 40 ms. Nunca al refrescar, al volver a la pantalla ni en búsquedas.
- **Pestañas**: el ícono activo pasa de contorno a relleno, con transición de color.
- **Háptica**: vibración corta solo al guardar una pesada y al cerrar la cosecha (`hapticSuccess`).
- **Movimiento reducido** (ajuste del sistema): se quitan desplazamientos y escalas; quedan los fundidos.

**Sensación nativa** (base global)
- Sin resaltado gris al tocar, sin rebote de la página entera (`overscroll-behavior: none`) y sin selección de texto en controles con toque largo (el contenido sí se puede copiar).
- **Sombras de elementos fijos con `box-shadow`, no con `filter: drop-shadow`** sobre contenedores grandes: en el WebView de Android, un filtro sobre la barra de pestañas, con los íconos cambiando de color al cambiar de pestaña, dejaba restos verdes sin repintar ("fantasmas" del ícono) encima de la barra. Un `drop-shadow` solo se usa en elementos pequeños que no cambian (el bulto del botón Crear).
- `touch-action: manipulation` en controles: el toque responde sin la espera del doble toque.
- Barra de estado con íconos oscuros (plugin `StatusBar`); el contenido se dibuja detrás, así que toma el color de la pantalla (gris niebla bajo el encabezado) sin franja.
- Teclado correcto por campo: `inputmode` (numérico o decimal), `enterkeyhint` (siguiente, listo, ir) y `autocapitalize` en nombres.
- Cifras con `font-variant-numeric: tabular-nums` (clase `.num`) para que kilos y montos no se muevan al cambiar.
- Selección de texto, cursor y anillo de foco con los colores de la marca, no los del WebView.

**Reglas de composición** (skills `impeccable` y `redesign-existing-projects`, ver `PRODUCT.md`)
- Sin etiquetas pequeñas en mayúsculas encima de un título: el título se sostiene solo.
- Íconos en listas: dentro de un **chip circular suave** solo en filas de navegación y registros con ícono (estilo sistema, rediseño 2026-10-24); **nunca** detrás de un título ni como adorno de una sección. Personas y cuadrillas llevan iniciales en el chip (contenido), no un ícono genérico.
- Sin tarjetas dentro de tarjetas: dentro de una tarjeta se agrupa con líneas finas y espacio.
- Montos negativos con el signo antes del símbolo: `−$ 276.000 COP`. Ganancia cero en color de texto; el verde es para ganar y el rojo tierra para perder.
- Títulos en oración ("Noticias del café"). En páginas internas el título de la barra baja a 22sp para no cortarse.
- La tarjeta del precio FNC lleva el dibujo de ramas del arranque multiplicado sobre el verde: es la firma de la marca, no se repite en otras pantallas.

## 3. Navegación

### 3.1 Estructura de navegación

Navegación principal por barra inferior de pestañas flotante (patrón estándar en apps Android), con 4 accesos directos, el botón de acción Crear al centro y flujos de profundización (drill-down) dentro de cada pestaña:

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
│  Barra inferior: Inicio | Mercado | (+) |    │
│                  Historial | Perfil          │
└─────────────────────────────────────────────┘
Inicio (dashboard de la cosecha activa)
├── Continuar → Cuadrillas
├── Pagar ahora (atajo) → Detalle de recolector con el pago en marcha
└── Actividad reciente → Detalle de recolector

(+) Crear
├── Sin cosecha: Abrir cosecha (formulario)
└── Con cosecha: estado + Editar / Eliminar (⋮)
    ├── Ir a la cosecha → Cuadrillas
    │   └── Detalle de cuadrilla
    │       └── Detalle de recolector
    │           ├── Registro de pesada
    │           └── Pagar ahora (confirmación de monto)
    └── Cerrar cosecha
        └── Registro de venta y costos → Resumen de ganancia de la cosecha

Mercado (precio y noticias)
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
**Inicio**, el dashboard de la cosecha activa: lo primero que se ve es cómo va (kilos, pagos pendientes, ganancia estimada), y "Continuar" lleva en un toque al flujo más usado (pesar y pagar recolectores), consistente con que el uso principal ocurre en el cafetal.

### 3.3 Elementos de navegación
- Barra inferior de pestañas flotante (4 pestañas: Inicio, Mercado, Historial, Perfil), con etiquetas de una sola palabra para que quepan en 360dp. La pestaña activa pasa a ícono relleno y etiqueta en negrita `--color-primary-ink`.
- **Crear** (botón circular verde al centro, que sobresale de la barra) es una sección con ruta propia (`/create`, §1.2.1): sin cosecha muestra el formulario para abrirla; con una abierta, su estado y por qué no se puede abrir otra. El círculo siempre es verde. Su etiqueta va gris como las de las pestañas y pasa a verde oscuro en negrita solo estando en Crear, para que nunca parezcan seleccionadas dos secciones; estar en Crear se anuncia con `aria-current="page"`.
- Dentro de cada pestaña, navegación por profundización (tocar una tarjeta lleva al detalle) con botón de "volver" estándar.
- "Cuadrillas" y "Cerrar cosecha" no son pestañas propias, porque dependen de que haya una cosecha activa: a Cuadrillas se llega con "Continuar" (Inicio) o "Ir a la cosecha" (Crear); "Cerrar cosecha" está en Crear.
- El catálogo de trabajadores y el aviso de privacidad viven dentro de Perfil, por ser de uso ocasional (no diario).

### 3.4 Niveles de navegación
1. **Nivel -1 — Splash:** logo nativo (ícono sobre blanco) mientras se verifica la sesión contra el backend (ver §1.0).
2. **Nivel 0 — Autenticación:** Login/Registro (fuera de la barra de pestañas), solo si no hay sesión válida.
3. **Nivel 1 — Secciones principales:** Inicio, Mercado, Crear, Historial, Perfil.
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
