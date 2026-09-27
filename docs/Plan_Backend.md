# Plan de Trabajo Backend — CosechApp

Este documento consolida todas las decisiones de arquitectura, stack, principios y flujo de entrega acordadas para el backend de CosechApp. Sirve como guía de implementación ordenada antes de escribir cualquier código.

---

## 1. Stack y Arquitectura

| Aspecto | Decisión |
|---------|----------|
| **Framework** | NestJS sobre Node.js, en TypeScript |
| **ORM** | Prisma, con capa de mapeo (mapper) entre modelo Prisma y entidades de dominio — el dominio **nunca** importa Prisma |
| **Estructura repo** | Monolito. Backend en `backend/`, hermana de `src/` (frontend Angular/Ionic existente no se toca) |
| **Arquitectura** | Hexagonal dentro de `backend/src/` |

```
backend/src/
├── domain/                      # entidades, puertos (interfaces) y casos de uso
│   ├── harvest/                 # cosecha + cuadrilla
│   │   ├── harvest.entity.ts
│   │   ├── crew.entity.ts
│   │   ├── harvest.repository.ts        # puerto
│   │   └── use-cases/
│   │       ├── open-harvest.use-case.ts
│   │       └── close-harvest.use-case.ts
│   ├── worker/                  # catálogo global de trabajadores
│   ├── weighing/                # pesada
│   ├── payment/                 # pago, incluye "pagar ahora"
│   │   └── use-cases/pay-now.use-case.ts
│   ├── sale-and-costs/          # venta + costos de producción + ganancia
│   └── price-and-news/          # precio FNC + noticias + notificaciones
│
├── infrastructure/
│   ├── http/                    # controllers de NestJS
│   └── persistence/             # adaptadores Prisma que implementan los puertos de domain/
│
├── shared/                      # utilidades transversales, sin lógica de negocio
├── app.module.ts
└── main.ts
```

**Regla de oro:** `domain/` no importa nada de NestJS, Prisma ni ningún framework. Los adaptadores concretos viven exclusivamente en `infrastructure/`.

---

## 2. Idiomas

| Contexto | Idioma |
|----------|--------|
| Código fuente (carpetas, clases, variables, funciones, archivos, tablas/columnas BD) | **Inglés** |
| Interfaz (labels, mensajes al caficultor, notificaciones, texto visible) | **Español** |
| Mensajes de commit | **Español**, con prefijos Conventional Commits |

---

## 3. Mapeo de Entidades (PRD español → Código inglés)

| PRD (español) | Código (inglés) |
|---------------|-----------------|
| Cosecha | Harvest |
| Cuadrilla | Crew |
| Trabajador | Worker |
| RecolectorCosecha | HarvestWorker |
| Pesada | Weighing |
| Pago | Payment |
| CostoProduccion | ProductionCost |
| Venta | Sale |
| PrecioFNC | CoffeePrice |
| Notificacion | Notification |

---

## 4. Principios de Código

### SOLID
- **S:** Un caso de uso por acción (`OpenHarvestUseCase`, `PayNowUseCase`), no un servicio gigante.
- **O:** Funcionalidad nueva = caso de uso/adaptador nuevo, sin tocar dominio ya probado.
- **L:** Cualquier implementación de un puerto (`PrismaHarvestRepository`, mock en tests) sustituible sin romper el caso de uso.
- **I:** Puertos con solo los métodos que realmente se usan, no interfaces genéricas de "repositorio universal".
- **D:** El dominio depende de puertos (interfaces), nunca de Prisma o NestJS directamente.

### DRY
Cualquier regla de cálculo (ej. pago a recolector: `pesadas × precio_cosecha − alimentación`) vive en **un único lugar del dominio** y se reutiliza, nunca se reimplementa en otra capa.

### Clean Code
- Nombres descriptivos en inglés en el código.
- Funciones cortas de un solo nivel de abstracción.
- Manejo explícito de errores (nunca silenciar excepciones).
- Sin comentarios que compensen código poco claro — si hace falta comentario para entenderlo, se reescribe.

### Patrones de Diseño
| Patrón | Aplicación |
|--------|------------|
| **Repository** | Puertos en `domain/` + adaptadores en `infrastructure/persistence/` |
| **Mapper** | Conversión entre modelo Prisma y entidades de dominio |
| **Factory** | Creación de entidades con reglas de inicialización (ej. `Harvest` nueva siempre inicia en estado `active`) |
| **Strategy** | Puerta abierta en cálculo de pago para futuras variantes (hoy solo destajo) |

---

## 5. Configuración de Neon

**Orden estricto de pasos** (ver `wiki/connect_neon_db.md`):
1. Instalación CLI de Neon
2. Login
3. Skills
4. MCP
5. Link al proyecto
6. Config init
7. Actualizar `neon.ts`
8. Deploy

**Antes de `neon link`:** Verificar que `backend/.env`, `backend/.env.local` y `backend/node_modules` estén en `.gitignore`. El paso `neon link` escribe el `DATABASE_URL` real en un archivo local automáticamente — debe quedar protegido **antes** de que eso ocurra.

**Notas importantes:**
- `neon.ts` / `neon deploy` configuran servicios y política de rama de Neon — **no crean las tablas** de la aplicación; no asumir que este paso reemplaza las migraciones.
- **Nunca** leer en voz alta, loggear ni commitear el contenido de `.env`, `.env.local`, ni el valor de `DATABASE_URL`.

---

## 6. Tablas / Esquema de Base de Datos

Una vez disponible el `DATABASE_URL` local, crear el esquema mediante **migraciones de Prisma** (en inglés, según mapeo de entidades), siguiendo el modelo de datos de la sección 12 del PRD y respetando las relaciones ahí definidas.

La creación del esquema se hace por **migraciones versionadas en el repositorio**, no por consultas sueltas vía herramientas de Neon para IA (skills/mcp), aunque estén disponibles.

Entidades principales (sección 12 PRD):
- `CoffeeGrower`: id, national_id, password (hash), profile_photo (optional)
- `Farm`: id, coffee_grower_id (one farm per coffee grower)
- `Harvest`: id, farm_id, name, price_per_kilogram, status (active/closed), opening_date, closing_date
- `Worker` (catalog): id, coffee_grower_id, first_name, last_name, alias (optional), phone_number (optional)
- `HarvestPicker`: id, harvest_id, worker_id, harvest_alias (optional), crew_id (optional), status (active/archived)
- `Crew`: id, harvest_id, name
- `WeightRecord`: id, harvest_picker_id, kilograms, date_time
- `Payment`: id, harvest_picker_id, amount (negative), includes_meals (boolean), meal_detail (price per meal or total per day), date_time
- `ProductionCost`: id, harvest_id, description, amount (negative), date
- `Sale`: id, harvest_id, actual_dry_kilograms, sale_price, date
- `FNCPrice` (cache): id, value, query_date
- `Notification`: id, coffee_grower_id, type (price change), date, read (boolean)

---

## 7. Autenticación

- **JWT** para las sesiones
- **bcrypt** para el hash de la contraseña
- Consistente con login por cédula y contraseña definido en PRD (sin verificación de correo ni teléfono)

---

## 8. Pruebas

- Cada caso de uso del dominio debe llevar su **test unitario**.
- La arquitectura hexagonal los aísla de la infraestructura → **sin necesidad de base de datos ni servidor levantado** para probarlos.

---

## 9. Plan de Entrega y Flujo de Trabajo

### Rama de Trabajo
- Trabajar en la rama `feature/backend-hexagonal`, **no directo a main**.

### Commits
- Por cada tarea completada del plan (una entidad/caso de uso completo: dominio + puerto + adaptador + endpoint), **un commit independiente** a GitHub.
- Mensajes en español, siguiendo Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- **Un commit por tarea**, no uno grande al final.

### Orden de Implementación (Fases)

El plan se ejecuta en este orden estricto:

---

## 10. Tareas Detalladas por Fase

### FASE 1: Fundación — Autenticación, Cosechas, Catálogo de Trabajadores

| # | Tarea | Entregables (dominio + puerto + adaptador + endpoint) | Commit Sugerido |
|---|-------|------------------------------------------------------|-----------------|
| 1.1 | Configuración inicial del proyecto NestJS + Prisma | `backend/` con `package.json`, `tsconfig.json`, `prisma/schema.prisma` inicial, `app.module.ts`, `main.ts` | `chore: inicializa proyecto backend NestJS con Prisma` |
| 1.2 | Configuración de Neon y migración inicial | `.env` (protegido en .gitignore), `prisma/schema.prisma` con modelos base, primera migración | `chore: configura Neon y crea migración inicial del esquema` |
| 1.3 | Entidad `CoffeeGrower` + Auth (register/login) | `domain/auth/`, `infrastructure/persistence/`, `infrastructure/http/auth.controller.ts`, JWT/bcrypt | `feat: implementa autenticación con cédula y contraseña (JWT + bcrypt)` |
| 1.4 | Entidad `Farm` (una por caficultor) | `domain/farm/`, repositorio, adaptador Prisma, endpoint | `feat: agrega entidad Farm vinculada a CoffeeGrower` |
| 1.5 | Entidad `Harvest` + casos de uso open/close | `domain/harvest/harvest.entity.ts`, `harvest.repository.ts`, `open-harvest.use-case.ts`, `close-harvest.use-case.ts`, adaptador, controller | `feat: implementa apertura y cierre de cosechas (una activa a la vez)` |
| 1.6 | Entidad `Worker` (catálogo global) | `domain/worker/worker.entity.ts`, `worker.repository.ts`, CRUD casos de uso, adaptador, controller | `feat: implementa catálogo global de trabajadores` |

---

### FASE 2: Registro Operativo — Asignación Recolectores, Cuadrillas, Pesadas

| # | Tarea | Entregables | Commit Sugerido |
|---|-------|-------------|-----------------|
| 2.1 | Entidad `HarvestWorker` (asignación trabajador a cosecha) | `domain/harvest/harvest-worker.entity.ts`, puerto, casos de uso assign/archive, adaptador, endpoint | `feat: permite asignar y archivar recolectores en una cosecha` |
| 2.2 | Entidad `Crew` (cuadrillas por cosecha) | `domain/harvest/crew.entity.ts`, puerto, casos de uso CRUD, adaptador, endpoint | `feat: implementa cuadrillas con nombre libre por cosecha` |
| 2.3 | Entidad `Weighing` (pesadas ilimitadas por día) | `domain/weighing/weighing.entity.ts`, puerto, caso de uso `record-weighing.use-case.ts`, adaptador, endpoint | `feat: registra pesadas ilimitadas por recolector y día` |

---

### FASE 3: Pagos — Cálculo, Alimentación, "Pagar Ahora"

| # | Tarea | Entregables | Commit Sugerido |
|---|-------|-------------|-----------------|
| 3.1 | Lógica de cálculo de pago (destajo + alimentación) | `domain/payment/payment-calculator.ts` (Strategy/Factory), entidad `Payment`, puerto | `feat: implementa cálculo de pago (pesadas × precio − alimentación)` |
| 3.2 | Caso de uso "Pay Now" | `domain/payment/use-cases/pay-now.use-case.ts`, adaptador, endpoint `POST /payments` | `feat: agrega botón "Pagar ahora" por recolector individual` |
| 3.3 | Historial de pagos por recolector | Endpoint `GET /harvests/:id/pickers/:pickerId/payments` | `feat: expone historial de pagos por recolector en cosecha` |

---

### FASE 4: Cierre de Cosecha — Venta, Costos, Ganancia, Historial

| # | Tarea | Entregables | Commit Sugerido |
|---|-------|-------------|-----------------|
| 4.1 | Proyección kilos secos (`cherry_kilograms / 5`) | `domain/sale-and-costs/dry-kilogram-projector.ts` (domain service), endpoint | `feat: calcula proyección de kilos secos (factor 5:1)` |
| 4.2 | Entidad `Sale` + ganancia bruta | `domain/sale-and-costs/sale.entity.ts`, caso de uso `record-sale.use-case.ts`, adaptador, endpoint | `feat: registra venta real y calcula ganancia bruta` |
| 4.3 | Entidad `ProductionCost` + ganancia de cosecha | `domain/sale-and-costs/production-cost.entity.ts`, casos de uso CRUD, adaptador, endpoint | `feat: registra costos de producción y calcula ganancia de cosecha` |
| 4.4 | Historial de cosechas cerradas | Endpoint `GET /harvests/history`, detalle por cosecha | `feat: expone historial de cosechas con detalle de ganancia` |

---

### FASE 5: Información Externa — Precio FNC, Noticias, Notificaciones

| # | Tarea | Entregables | Commit Sugerido |
|---|-------|-------------|-----------------|
| 5.1 | Entidad `CoffeePrice` (cache FNC) + scraping job | `domain/price-and-news/coffee-price.entity.ts`, puerto, job programado (cron), adaptador, endpoint `GET /fnc-price` | `feat: implementa cache de precio FNC con scraping programado` |
| 5.2 | Notificaciones de cambio de precio | `domain/price-and-news/notification.entity.ts`, servicio FCM, endpoint `GET /notifications` | `feat: notificaciones push por cambio de precio FNC (FCM)` |
| 5.3 | Noticias y tips (FNC/Cenicafé) | Entidad `News`, puerto, job de sincronización, endpoint `GET /news` | `feat: agrega sección de noticias/tips con resumen y enlace a fuente` |

---

### FASE 6: Sincronización Offline/Online (Backend Support)

| # | Tarea | Entregables | Commit Sugerido |
|---|-------|-------------|-----------------|
| 6.1 | Endpoint batch sync | `POST /sync` que recibe lote de registros pendientes, resuelve conflictos por timestamp (last-write-wins) | `feat: implementa endpoint de sincronización batch con resolución de conflictos` |
| 6.2 | Auditoria / timestamps en todas las entidades | `created_at`, `updated_at`, `synced_at` en modelo Prisma | `chore: agrega campos de auditoría y sincronización a todas las tablas` |

---

## 11. Checklist de Validación por Tarea

Antes de considerar una tarea completada y commitear:

- [ ] Dominio: entidad + puerto + caso(s) de uso + test unitario(s)
- [ ] Infraestructura: adaptador Prisma implementando el puerto + mapper
- [ ] HTTP: controller NestJS con DTOs y validación
- [ ] Migración Prisma generada y versionada (si aplica)
- [ ] Código en inglés, mensajes de interfaz en español
- [ ] Commit individual con mensaje Conventional Commit en español
- [ ] Push a rama `feature/backend-hexagonal`

---

## 12. Notas de Implementación Clave

1. **Mapper Pattern:** Cada adaptador Prisma incluye un `toDomain()` y `toPersistence()` para convertir entre entidad de dominio y modelo Prisma. El dominio nunca ve Prisma.

2. **Factory para Harvest:** `HarvestFactory.create(name, pricePerKg)` → instancia con `status: 'active'`, `openingDate: new Date()`, `closingDate: null`.

3. **Strategy para Payment:** `PaymentCalculatorStrategy` interface con implementación `PieceRateCalculator` hoy. Preparado para futuras variantes.

4. **Error Handling:** Excepciones de dominio (`HarvestAlreadyActiveError`, `PickerNotFoundError`, etc.) lanzadas desde casos de uso, atrapadas en filtros de excepción de NestJS en `infrastructure/http/`.

5. **Validación:** DTOs en controllers con `class-validator`; reglas de negocio en casos de uso.

6. **Tests:** Un archivo `.spec.ts` por caso de uso, mockando el puerto (repository). Ej: `open-harvest.use-case.spec.ts`.

---

## 13. Referencias

- PRD completo: `wiki/PRD.md` (secciones 12 modelo de datos, 13 arquitectura, 14 API)
- Design System: `wiki/Design_System.md` (contenido de pantallas, navegación)
- Neon setup: `wiki/connect_neon_db.md`
- Convenciones de commit: Conventional Commits en español

---

**Estado:** Plan listo. Próximo paso: crear rama `feature/backend-hexagonal` y comenzar con **Tarea 1.1**.
Thought · 5.5s
El plan ha sido creado en /home/mrobot/.opencode/plan/plan-backend.md con toda la consolidación solicitada.
Resumen del contenido:
Stack y arquitectura — NestJS + Prisma + arquitectura hexagonal en backend/src/ con separación estricta domain/ vs infrastructure/
Idiomas — Código en inglés, interfaz en español, commits en español (Conventional Commits)
Mapeo de entidades — Tabla PRD (español) → Código (inglés) para 10 entidades
Principios — SOLID, DRY, Clean Code + patrones Repository, Mapper, Factory, Strategy
Configuración Neon — 8 pasos ordenados, protección .env antes de neon link, migraciones versionadas (no queries sueltas)
Tablas/Esquema — 12 entidades principales según sección 12 del PRD
Auth — JWT + bcrypt, login por cédula/contraseña
Tests — Unitarios por caso de uso, sin BD ni servidor (hexagonal)
Plan de entrega — Rama feature/backend-hexagonal, 1 commit por tarea, orden: Auth → Cosechas/Trabajadores → Pesadas/Pagos/Cuadrillas → Venta/Costos/Ganancia → Precio FNC/Notificaciones
22 tareas detalladas en 6 fases con entregables y mensajes de commit sugeridos
Checklist de validación por tarea
Notas de implementación — Mapper, Factory, Strategy, Error Handling, Validación, Tests
El documento está listo. Cuando quieras empezar la implementación, cambia al agente de ejecución y comenzaremos con la Tarea 1.1 (inicialización del proyecto NestJS + Prisma en backend/).


