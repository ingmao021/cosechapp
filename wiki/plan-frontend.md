# Plan de Trabajo Frontend — CosechApp

**Rama de trabajo:** `feature/frontend-pixel-perfect`  
**Stack:** Angular + Ionic + Capacitor (existente en la raíz)  
**Estado:** Angular Signals + Facade por feature  
**Arquitectura src/app/:** organizada por módulos de negocio del backend

---

## 0. Preparación y configuración base (previo a la primera tarea)

- [ ] Crear rama `feature/frontend-pixel-perfect` desde `main`.
- [ ] Verificar `package.json` y versiones exactas de Angular, Ionic, Capacitor.
- [ ] Instalar/verificar dependencias necesarias:
  - `@capacitor/secure-storage-plugin` (o `capacitor-secure-storage-plugin`) para JWT cifrado.
  - `@capacitor/network` para detección de conectividad.
  - `@capacitor/push-notifications` para FCM (notificaciones de precio).
  - `@capacitor-community/sqlite` + `jeep-sqlite` para almacenamiento offline (fase 5).
- [ ] Configurar `capacitor.config.ts`:
  - Splash nativo con `Cosech.png` (object-fit: cover, centrado).
  - Plugins habilitados: SecureStorage, Network, PushNotifications, SQLite.
- [ ] Añadir fuentes locales en `src/assets/fonts/`:
  - `ZillaSlab-Regular.ttf`, `ZillaSlab-Bold.ttf`
  - `Inter-Regular.ttf`, `Inter-Bold.ttf`
  - Definir `@font-face` en `global.scss` usando los tokens del Design System.
- [ ] Crear `src/theme/variables.css` con **todos los Design Tokens** (sección 2.2 del Design System) como variables CSS:
  - Colores, tipografía, espaciado, radios, sombras, touch-target.
- [ ] Crear `src/app/shared/` con:
  - `pipes/` → `kilos.pipe.ts`, `currency.pipe.ts`, `date.pipe.ts` (formato español CO).
  - `components/` → átomos/moléculas reutilizables (ver tareas 1.x).
  - `utils/` → helpers puros (ej. `formatKilos`, `formatCurrency`).
- [ ] Configurar `HttpInterceptor` para inyectar `Authorization: Bearer <token>` en todas las peticiones autenticadas.
- [ ] Configurar `Jasmine/Karma` (ya incluido) y `TestBed` base para services/components.

> **Regla:** No se empieza la Tarea 1 hasta que todo lo anterior esté commitido y funcionando (build + test pass).

---

## 1. Splash + Autenticación (Auth)

### 1.1 Splash nativo + verificación de sesión
- **Archivos:** `capacitor.config.ts` (ya configurado en paso 0), `src/app/auth/auth.facade.ts`, `src/app/auth/auth.service.ts`, `src/app/auth/pages/splash.page.ts`.
- **Lógica:**
  - Al arrancar, `AuthFacade.initSession()` lee token de SecureStorage.
  - Si hay token → `GET /auth/me` (con interceptor).
    - 200 → navega a `/home` (Inicio).
    - 401/403/error de red → limpia token y navega a `/auth/login`.
  - Si no hay token → navega a `/auth/login`.
- **Test:** `auth.facade.spec.ts` mockeando SecureStorage + HttpClient.

### 1.2 Login / Registro (pantalla)
- **Página:** `src/app/auth/pages/login.page.ts` + template + styles.
- **Componentes atómicos (shared):**
  - `app-input` (texto/numérico, 48dp alto, 16dp padding, radius 8dp).
  - `app-button-primary` (48dp alto, 24dp padding horizontal, radius 24dp pill, icono 20dp opcional).
  - `app-button-icon` (48×48dp, radius 24dp circular, icono 24dp).
- **Campos:** Cédula (input texto), Contraseña (input password), Foto de perfil opcional (avatar 64dp, radius 50%).
- **Botones:** "Ingresar" (primario), "Crear cuenta" (enlace estilo texto).
- **Validaciones:** cédula 5–20 chars, contraseña 6–50 chars.
- **Facade:** `AuthFacade.login(nationalId, password)`, `AuthFacade.register(nationalId, password, profilePhoto?)`.
- **Service:** `AuthService.login(dto)`, `AuthService.register(dto)` → POST `/auth/login`, `/auth/register`.
- **Guardado de token:** en `login/register` success → `SecureStorage.set('jwt', accessToken)`.
- **Test:** componente renderiza, valida, llama a facade; facade orquesta service + storage.

### 1.3 Perfil (pestaña Perfil → incluye catálogo, cambiar contraseña, privacidad, logout)
- **Páginas:** `profile.page.ts`, `change-password.page.ts`, `privacy.page.ts`.
- **Catálogo de trabajadores:** acceso desde Perfil (ver Tarea 3.1), pero entry point aquí.
- **Logout:** `AuthFacade.logout()` → limpia SecureStorage → navega a `/auth/login`.
- **Test:** logout limpia token y redirige.

---

## 2. Inicio / Cosecha Activa (Harvest)

### 2.1 Facade + Service base
- `HarvestFacade`: signals `activeHarvest`, `activeHarvestPickers`, `activeHarvestCrews`, `syncStatus`, `fncPrice`.
- `HarvestService`: wrapper tipado a endpoints de `HarvestController`.

### 2.2 Pantalla Inicio (Home) — **Pestaña principal**
- **Contenido (Design System 1.2):**
  - Header organismo: nombre cosecha + precio/kilo + botón "Cerrar cosecha" (alerta).
  - Si no hay cosecha activa: tarjeta invitación "Abrir nueva cosecha" + input nombre + input precio/kilo + botón primario.
  - Precio FNC actual (cache) con fecha.
  - Indicador sincronización (pendientes / sincronizado).
  - Botón grande "Pesar" → navega a `/harvest/crews` (Cuadrillas).
- **Componentes:**
  - `harvest-header.organism.ts` (96dp alto, 16dp padding).
  - `harvest-empty-state.card.ts` (cuando no hay cosecha).
  - `fnc-price-chip.molecule.ts` (precio + fecha).
  - `sync-indicator.chip.molecule.ts`.
- **Navegación:** tabs root = `/home`.

### 2.3 Abrir cosecha
- **Modal o página:** `open-harvest.page.ts` (template formulario).
- **Campos:** Nombre (input texto, máx 100), Precio/kilo (input numérico, positivo).
- **Acción:** `HarvestFacade.openHarvest(name, pricePerKilogram)` → POST `/harvests`.
- **Test:** valida campos, llama service, actualiza signal `activeHarvest`.

### 2.4 Cerrar cosecha (flujo completo → Tarea 5)
- Desde Inicio, botón "Cerrar cosecha" (botón alerta) → navega a `/harvest/close` (Tarea 5.1).

---

## 3. Cuadrillas + Catálogo de Trabajadores (Worker + Harvest/Crews)

### 3.1 Catálogo de trabajadores (Worker) — **Acceso desde Perfil**
- **Página:** `worker-catalog.page.ts` (template lista + botón agregar).
- **Lista:** filas 56dp, 16dp padding horizontal, icono 24dp, nombre completo + alias + teléfono.
- **Agregar:** modal/página `worker-form.page.ts` (template formulario).
  - Campos: Nombre, Apellido, Alias (opcional), Teléfono (opcional).
  - `WorkerFacade.createWorker(dto)` → POST `/workers`.
- **Editar/Eliminar:** swipe o menú contextual en cada fila.
- **Facade:** `WorkerFacade.workers` (signal), `createWorker`, `updateWorker`, `deleteWorker`.
- **Service:** `WorkerService` → endpoints `/workers`.

### 3.2 Cuadrillas (Crews) — **Pantalla desde Inicio → "Pesar"**
- **Página:** `crews.page.ts` (template lista).
- **Lista de cuadrillas:** cada fila = nombre + cantidad de recolectores (chip/molecule).
- **Crear cuadrilla:** modal con input nombre (máx 100) → `HarvestFacade.createCrew(name)` → POST `/harvests/:id/crews`.
- **Navegación:** tap fila → `/harvest/crews/:crewId` (Detalle de cuadrilla).

### 3.3 Detalle de cuadrilla
- **Página:** `crew-detail.page.ts`.
- **Header:** nombre cuadrilla.
- **Lista de recolectores:** `harvest-picker-card.molecule` (64dp min, 16dp padding, radius 12dp, avatar/icono 24dp, nombre/alias + kilos día).
- **Botón "Agregar recolector":** abre selector desde catálogo (workers no asignados a esta cosecha) + opción "Nuevo trabajador".
- **Asignar:** `HarvestFacade.assignWorkerToCrew(workerId, crewId, harvestAlias?)` → POST `/harvests/:id/pickers` + PATCH crewId si aplica.
- **Archivar recolector:** swipe → `HarvestFacade.archiveWorker(pickerId)` → PATCH `/harvests/:id/pickers/:pickerId/archive`.

### 3.4 Detalle de recolector (dentro de cosecha)
- **Página:** `picker-detail.page.ts` (template detalle).
- **Bloques:**
  - Nombre/alias (Nivel 2).
  - Pesadas del día: lista + botón "+" (icono 48×48dp circular) → navega a `/harvest/pickers/:pickerId/weighing/new`.
  - Acumulado semana + acumulado ciclo (chips/métricas).
  - Chip alimentación: "Con alimentación" / "Sin alimentación" (28dp alto, radius pill, 12dp padding horizontal).
  - Botón "Pagar ahora" (primario, radius-full 999dp, 48dp alto) → modal confirmación con monto calculado.
  - Historial de pagos: `payment-row.molecule` (monto + fecha + estado).
- **Facade:** `PickerDetailFacade` (o `HarvestFacade` expone `selectedPicker` + métodos).
- **Cálculos:** façade delega a backend (pay-now devuelve amountDue, totalKilograms).

---

## 4. Pesadas + Pagos (Weighing + Payment)

### 4.1 Registro de pesada
- **Página:** `weighing-form.page.ts` (template formulario).
- **Campos:** Kilos (input numérico, 48dp min, validación >0), Fecha/hora (automática, no editable).
- **Botón:** "Guardar pesada" (primario).
- **Facade:** `WeighingFacade.recordWeighing(pickerId, kilograms)` → POST `/weighings`.
- **Offline:** en fase 5 se marca pendiente; aquí solo llamada HTTP.
- **Test:** valida >0, llama service, actualiza lista en detalle de recolector.

### 4.2 Pagar ahora (modal confirmación)
- **Componente:** `pay-now-modal.component.ts` (molecule/organismo).
- **Contenido:** resumen (kilos totales × precio/kilo = bruto, - alimentación = neto), botón "Confirmar pago", "Cancelar".
- **Acción:** `PaymentFacade.payNow(pickerId, harvestId, includesMeals, mealDetail)` → POST `/payments/pay-now`.
- **Respuesta:** muestra payment creado + actualiza historial en detalle de recolector.

---

## 5. Cierre de Cosecha / Venta y Costos (Sale and Costs)

### 5.1 Pantalla Cierre de Cosecha (flujo guiado)
- **Página:** `harvest-close.page.ts` (template formulario multi-sección).
- **Sección 1 — Venta:**
  - Kilos secos reales (input numérico, positivo).
  - Precio de venta (input numérico, positivo).
  - Fecha venta (date picker, default hoy).
  - Botón "Calcular ganancia bruta" → POST `/sale-and-costs/sale` → muestra **Ganancia bruta** (Nivel 2).
- **Sección 2 — Costos de producción:**
  - Lista de costos agregados (description + monto negativo).
  - Botón "Agregar costo" → modal con descripción (máx 200) + monto (numérico, negativo) + fecha.
  - Cada costo → POST `/sale-and-costs/production-cost` → actualiza **Ganancia de la cosecha** (etiqueta explícita "Ganancia de la cosecha").
- **Sección 3 — Resumen final:**
  - Ganancia bruta, Total costos, **Ganancia de la cosecha** (destacada, Zilla Slab XL).
  - Botón "Confirmar y archivar cosecha" → PATCH `/harvests/:id/close` → navega a Historial.
- **Facade:** `SaleAndCostsFacade` con signals `sale`, `costs[]`, `grossProfit`, `actualProfit`.
- **Proyección kilos secos:** botón/info "Proyección (kilos cereza / 5)" → GET `/sale-and-costs/project-dry-kg?cherryKilograms=X`.

---

## 6. Precio FNC + Noticias + Notificaciones (Price and News)

### 6.1 Pestaña "Precio y Noticias"
- **Página:** `price-news.page.ts` (template panel organismo).
- **Header:** Precio actual FNC (valor grande, Zilla Slab, fecha consulta).
- **Lista de noticias:** `news-card.molecule` (título + fuente + resumen corto + botón "Leer más" → external link).
- **Pull-to-refresh** para forzar actualización (llama GET `/price-and-news/coffee-price`).
- **Cache offline:** última respuesta guardada en SecureStorage/IndexedDB para mostrar sin red.

### 6.2 Notificaciones (accesible desde campana global + pestaña)
- **Página:** `notifications.page.ts` (template lista).
- **Lista:** fecha + valor precio + estado leído/no leído.
- **Acción:** tap → marca leída (PATCH `/price-and-news/notifications/:id/read`).
- **Badge** en icono campana con contador no leídas (GET `/price-and-news/notifications/unread`).

---

## 7. Historial de Cosechas (History)

### 7.1 Pestaña Historial
- **Página:** `history.page.ts` (template lista).
- **Lista:** `harvest-history-card.molecule` (nombre + fechas + ganancia de la cosecha).
- **Tap fila** → `/history/:harvestId` (Detalle de cosecha cerrada).

### 7.2 Detalle de cosecha cerrada
- **Página:** `harvest-history-detail.page.ts` (template detalle).
- **Secciones:** Recolectores (con sus pagos), Venta, Costos, Ganancia bruta, Ganancia de la cosecha.
- **Solo lectura** (GET `/harvests/:id`, `/sale-and-costs/profit/:harvestId`, etc.).

---

## 8. Offline + Sincronización (Sync) — Fase transversal

> Se implementa **después** de que todas las pantallas funcionen online, como capa transversal.

### 8.1 Base de datos local (SQLite)
- Esquema espejo de entidades principales: harvests, workers, harvest_pickers, crews, weighings, payments, sales, production_costs, fnc_price, notifications.
- Columna `sync_status` ('synced' | 'pending' | 'conflict') + `local_timestamp`.

### 8.2 Detección de conectividad
- `@capacitor/network` listener → `NetworkFacade.isOnline$` (signal).
- Indicador visual en header (chip sync).

### 8.3 Escritura local-first
- Todos los `*Facade.create/update/delete` escriben en SQLite **primero** (status 'pending').
- Luego intentan POST/PATCH/DELETE al backend.
- Si éxito → actualizan status a 'synced'.
- Si falla/offline → queda 'pending'.

### 8.4 Sincronización automática
- Al detectar online → `SyncFacade.syncAll()` → POST `/sync/batch` con items pending.
- Backend devuelve resultado por item (conflictos resueltas por timestamp más reciente).
- Actualiza status local según respuesta.

### 8.5 Conflictos (last-write-wins)
- Timestamp en cada entidad local.
- Al recibir respuesta de sync con versión servidor más nueva → merge automático (sobrescribe local) o prompt si hay datos locales no subidos.

### 8.6 Push Notifications (FCM)
- `@capacitor/push-notifications` → registro token FCM en backend (endpoint por definir o en login).
- Manejo `pushNotificationReceived` en foreground → actualiza precio FNC local + muestra notificación local.

---

## 9. Componentes Compartidos (Shared) — Átomos y Moléculas

> Se crean **bajo demanda** cuando los necesite la primera pantalla que los use, pero **definidos una sola vez** en `src/app/shared/components/`.

| Componente | Tipo | Espec (Design System) |
|---|---|---|
| `app-button-primary` | Átomo | 48dp h, 24dp px, radius 24dp, icono 20dp |
| `app-button-icon` | Átomo | 48×48dp, radius 24dp circular, icono 24dp |
| `app-button-alert` | Átomo | igual primario pero color `--color-accent-alert` |
| `app-input` | Átomo | 48dp min h, 16dp px, radius 8dp |
| `app-avatar` | Átomo | 64dp, radius 50% |
| `status-chip` | Átomo | 28dp h, 12dp px, radius pill |
| `harvest-picker-card` | Molécula | 64dp min h, 16dp p, radius 12dp, icono 24dp |
| `weighing-input` | Molécula | input numérico + botón "+" (icon-button) |
| `payment-row` | Molécula | monto + fecha + estado |
| `meal-chip` | Molécula | "Con alimentación" / "Sin alimentación", 28dp h |
| `news-card` | Molécula | título + fuente + resumen + enlace |
| `harvest-history-card` | Molécula | nombre + fechas + ganancia |
| `crew-row` | Molécula | 56dp h, 16dp px, nombre + contador |
| `worker-row` | Molécula | 56dp h, 16dp px, nombre + alias + teléfono |
| `harvest-header` | Organismo | 96dp h, 16dp p, nombre + precio + btn cerrar |
| `bottom-nav-bar` | Organismo | 56dp + safe-area, 4 tabs, iconos 24dp |

**Pipes compartidos:**
- `kilosPipe` → "1.234 kg" (separador miles, 3 decimales máx).
- `currencyPipe` → "$ 1.234.567 COP" (formato CO).
- `datePipe` → "26 sep 2026, 14:30" (locale es-CO).

---

## 10. Orden de Ejecución y Commits (Conventional Commits)

Cada tarea = **un commit** al terminar (tests pass + visual pixel-perfect verificado).

| Orden | Tarea | Commit sugerido |
|---|---|---|
| 0 | Preparación base (config, tokens, fuentes, shared pipes, interceptor) | `chore: setup project foundation, design tokens, shared utils` |
| 1.1 | Splash nativo + verificación sesión | `feat(auth): implement native splash and session check` |
| 1.2 | Login / Registro (pantalla + facade + service + tests) | `feat(auth): implement login and register screens` |
| 1.3 | Perfil (logout, cambio contraseña, privacidad) | `feat(auth): implement profile tab with logout and settings` |
| 2.1 | Harvest Facade + Service | `feat(harvest): add harvest facade and service` |
| 2.2 | Pantalla Inicio (Home) + abrir cosecha | `feat(harvest): implement home screen with active harvest` |
| 3.1 | Catálogo de trabajadores (CRUD) | `feat(worker): implement worker catalog CRUD` |
| 3.2 | Cuadrillas (lista + crear) | `feat(harvest): implement crews list and creation` |
| 3.3 | Detalle de cuadrilla (lista recolectores + asignar/archivar) | `feat(harvest): implement crew detail with pickers management` |
| 3.4 | Detalle de recolector (pesadas, acumulados, alimentación, pagar) | `feat(harvest): implement picker detail with weighings and pay now` |
| 4.1 | Registro de pesada | `feat(weighing): implement weighing record screen` |
| 4.2 | Pagar ahora (modal + cálculo) | `feat(payment): implement pay now flow` |
| 5.1 | Cierre de cosecha (venta + costos + ganancia) | `feat(sale-and-costs): implement harvest close flow` |
| 6.1 | Pestaña Precio y Noticias | `feat(price-and-news): implement price and news tab` |
| 6.2 | Notificaciones (lista + marcar leída + badge) | `feat(price-and-news): implement notifications screen` |
| 7.1 | Historial de cosechas (lista) | `feat(history): implement harvest history list` |
| 7.2 | Detalle de cosecha cerrada | `feat(history): implement closed harvest detail` |
| 8.1 | SQLite local + esquema | `feat(sync): add local SQLite schema for offline` |
| 8.2 | Escritura local-first en facades | `feat(sync): implement local-first writes in facades` |
| 8.3 | Sincronización batch + detección red | `feat(sync): implement batch sync and network detection` |
| 8.4 | Push Notifications FCM | `feat(sync): add FCM push notifications for price changes` |

---

## 11. Criterios de "Terminado" por Tarea (Definition of Done)

1. **Tests pasan:** `ng test` → 0 fallos para archivos nuevos/modificados.
2. **Pixel-perfect:** Comparar captura de pantalla vs. medidas/colores de Design System (sección 2.3).
   - Usar `ionic serve` + Chrome DevTools device toolbar (360dp, 390dp, 412dp, 430dp).
   - Verificar: alturas, paddings, radios, tipografía (Zilla Slab/Inter), colores exactos (hex), touch-targets ≥48dp.
3. **Accesibilidad:** Contraste verificado (no usar `#8e716d` ni `#8C694C` en texto cuerpo).
4. **Navegación:** Rutas funcionan, back button nativo funciona, tabs mantienen estado.
5. **Sin errores consola:** ni warnings de Angular/Ionic.
6. **Commit:** mensaje Conventional Commits en español, scope claro, solo archivos de la tarea.

---

## 12. Hallazgos / Riesgos a Reportar (no bloqueantes)

- Si algún endpoint del backend real difiere del PRD (sección 14) → documentar en `wiki/frontend-findings.md` y continuar con lo que devuelve el backend.
- Si falta endpoint para registrar token FCM → reportar y simular localmente.
- Si `@capacitor/secure-storage-plugin` no está disponible → evaluar `@capacitor/preferences` + cifrado manual (WebCrypto) como fallback, pero documentar.
- Si fuentes Zilla Slab/Inter tienen licencia → confirmar archivos locales incluidos en repo.

---

## 13. Próximos Pasos Inmediatos

1. Usuario confirma el plan (o pide ajustes).
2. Crear rama `feature/frontend-pixel-perfect`.
3. Ejecutar Tarea 0 (preparación base) → commit.
4. Ejecutar Tarea 1.1 → commit.
5. ... y así sucesivamente.

---

**Nota:** Este plan cubre **únicamente** `src/` (frontend). No se modifica `backend/` bajo ninguna circunstancia. Inconsistencias se reportan, no se corrigen desde aquí.