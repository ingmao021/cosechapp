<p align="center">
  <img src="src/assets/brand/logo.png" alt="CosechApp" width="280" />
</p>

# CosechApp

**Pesadas y pagos de tu cosecha de café, con o sin señal.**

App Android para caficultores colombianos que reemplaza el cuaderno de papel de la recolección: registra las pesadas de cada recolector, calcula lo que se le debe pagar, lleva la venta y los costos, y muestra cuánto se ganó de verdad en cada cosecha.

---

## Descripción

En la recolección de café, el caficultor anota a mano los kilos que trae cada recolector, varias veces al día, y al final de la semana o de la cosecha suma, descuenta la alimentación y paga. Ese cuaderno se moja, se pierde y se presta a errores en los pagos; además, casi nunca permite saber cuánto dejó realmente la cosecha.

CosechApp resuelve eso desde el celular:

- **Problema:** pagos con errores, información dispersa y sin saber la ganancia real; en el cafetal muchas veces no hay señal.
- **Solución:** una app sencilla, pensada para usarse a pleno sol y sin conexión, que lleva pesadas, pagos, venta y costos en un solo lugar.
- **Objetivo:** que el caficultor deje el cuaderno, no se equivoque en los pagos y sepa cuánto ganó.

El usuario es el caficultor (único rol). Los recolectores no usan la app. El piloto se enfoca en fincas de Nariño.

## Características principales

- **Cuenta con cédula y contraseña**, sin correo ni verificación por teléfono. Bloqueo temporal tras 5 intentos fallidos. La sesión (JWT) se guarda cifrada en el teléfono.
- **Cosechas con nombre propio** (pasón, mitaca o el que el caficultor elija). Una sola cosecha activa a la vez; al cerrarla pasa al historial.
- **Trabajadores y cuadrillas:** catálogo de recolectores reutilizable entre cosechas.
- **Pesadas ilimitadas por día** para cada recolector, con precio por kilo.
- **Funciona sin señal:** las pesadas y acciones de campo se guardan en el teléfono y se envían solas al volver la conexión, indicando qué queda pendiente.
- **Pagos:** "pagar ahora" a un recolector o liquidación de todos al cerrar la cosecha, con la alimentación descontada por día.
- **Venta y costos de producción** de cada cosecha, con proyección de kilos secos a partir de los kilos cereza.
- **Ganancia en dos niveles:** bruta y real (descontando pagos y costos).
- **Precio oficial del café (FNC)** con aviso cuando cambia, y **noticias del café** seleccionadas con IA (Gemini), actualizadas cada mañana.
- **Diseño para el campo:** tema claro de alto contraste, botones grandes (≥ 48 dp), textos simples y formato de pesos colombianos.

## Tecnologías utilizadas

### App móvil (raíz del repositorio)

| Área | Tecnología |
| --- | --- |
| Lenguaje | TypeScript 6 |
| Framework | Angular 22 (componentes standalone, signals) + Ionic 9 |
| Nativo | Capacitor 8 (Android): App, Haptics, Keyboard, Network, Splash Screen, Status Bar |
| Almacenamiento seguro | `@aparajita/capacitor-secure-storage` (AES-GCM + Android Keystore) |
| Reactividad | RxJS 7 |
| Pruebas | Vitest 4 + jsdom |
| Calidad | ESLint 9 + angular-eslint |

### Backend (`backend/`)

| Área | Tecnología |
| --- | --- |
| Framework | NestJS 12, arquitectura hexagonal (dominio / infraestructura) |
| Base de datos | PostgreSQL en [Neon](https://neon.tech) (ramas `prod` y `e2e`) |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Autenticación | JWT (Passport) + bcrypt |
| IA | Google Gemini (`@google/genai`), plan gratuito |
| Pruebas | Jest 30 (unitarias y e2e) |

### Infraestructura

- **Render:** hospeda el backend (`render.yaml`), con despliegue automático desde `main`.
- **GitHub Actions:** `coffee-intel.yml` actualiza cada día a las 7:00 a. m. (hora de Colombia) el precio FNC, las noticias y su análisis.

## Requisitos previos

- **Node.js 24** (el backend en Render usa `NODE_VERSION=24`) y **npm**.
- **Git**.
- Para Android:
  - **Android Studio** con Android SDK (minSdk 24, targetSdk 36).
  - **JDK 21** (el que trae Android Studio funciona).
  - Un emulador (por ejemplo Pixel 7) o un teléfono con depuración USB.
- Para el backend local: una base de datos **PostgreSQL** (recomendado: una rama de Neon).

No hace falta instalar Angular CLI, Ionic CLI ni Nest CLI de forma global: se usan las versiones locales por medio de `npm` y `npx`.

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/ingmao021/cosechapp.git
cd cosechapp

# 2. Dependencias de la app
npm ci

# 3. Dependencias del backend (genera el cliente de Prisma automáticamente)
cd backend
npm ci

# 4. Variables de entorno del backend
cp .env.example .env    # y completar los valores (ver "Variables de entorno")

# 5. Crear las tablas en la base de datos
npx prisma migrate deploy
cd ..
```

## Uso

### Backend

```bash
cd backend
npm run start:dev       # desarrollo, con recarga automática (http://localhost:3000)
npm run build           # compila a dist/
npm run start:prod      # ejecuta la versión compilada
```

Comprobación rápida:

```bash
curl http://localhost:3000/health
```

### App en el navegador (desarrollo)

```bash
npm start               # http://localhost:4200
```

La URL del backend se configura en `src/environments/environment.ts` (desarrollo) y `src/environments/environment.prod.ts` (producción, apunta a `https://cosechapp-backend.onrender.com`).

### App en Android

```bash
npm run build           # compila la app web a www/ (configuración de producción)
npx cap sync android    # copia www/ y los plugins al proyecto nativo
npx cap run android     # instala y abre la app en el emulador o el teléfono
```

Para generar un APK de depuración:

```bash
cd android
./gradlew assembleDebug   # resultado en android/app/build/outputs/apk/debug/
```

También se puede abrir el proyecto en Android Studio con `npx cap open android`.

### Flujo de ejemplo

1. **Crear cuenta** con cédula, nombre y contraseña.
2. **Crear una cosecha** (por ejemplo, "Pasón 2026") con el precio por kilo.
3. **Agregar los recolectores** desde el catálogo de trabajadores.
4. En el cafetal, **registrar las pesadas** de cada recolector, aunque no haya señal.
5. **Pagar** a un recolector cuando lo pida, o a todos al **cerrar la cosecha**, registrando la venta y los costos.
6. Revisar en el **historial** la ganancia bruta y real de la cosecha.

## Estructura del proyecto

```text
cosechapp/
├── src/                        # App Ionic + Angular
│   ├── app/
│   │   ├── auth/               # Login, registro y sesión
│   │   ├── harvest/            # Cosechas: activa, cierre e historial
│   │   ├── weighing/           # Pesadas
│   │   ├── payment/            # Pagos y liquidaciones
│   │   ├── worker/             # Catálogo de trabajadores y cuadrillas
│   │   ├── sale-and-costs/     # Venta y costos de producción
│   │   ├── price-and-news/     # Precio FNC y noticias del café
│   │   ├── sync/               # Cola offline y sincronización
│   │   ├── network/            # Detección de conectividad
│   │   ├── core/               # Layout, interceptores HTTP y animaciones
│   │   └── shared/             # Componentes, pipes y utilidades comunes
│   ├── assets/                 # Marca (logo, splash), fuentes e íconos
│   ├── environments/           # URL del backend por entorno
│   └── theme/                  # Tokens de diseño (colores, tipografía, espaciado)
├── android/                    # Proyecto nativo generado por Capacitor
├── resources/                  # Fuentes del ícono y splash (@capacitor/assets)
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── domain/             # Entidades, puertos y casos de uso (sin dependencias de framework)
│   │   ├── infrastructure/
│   │   │   ├── http/           # Controladores, DTOs, guards JWT y módulos por dominio
│   │   │   ├── persistence/    # Repositorios Prisma (adaptadores de los puertos)
│   │   │   └── ai/             # Precio FNC, Google Noticias y Gemini
│   │   └── shared/             # Utilidades comunes
│   ├── prisma/                 # schema.prisma y migraciones
│   └── test/                   # Pruebas e2e contra la rama e2e de Neon
├── wiki/                       # PRD, Design System (incluye el contrato de la API, §2.7) y guías
├── .github/workflows/          # Actualización diaria de precio y noticias
├── capacitor.config.ts         # Configuración nativa (splash, status bar, plugins)
├── render.yaml                 # Blueprint de Render para el backend
└── PRODUCT.md                  # Resumen de producto: usuarios, principios y marca
```

## Variables de entorno

El backend lee su configuración de `backend/.env` (plantilla en `backend/.env.example`). **Nunca subas archivos `.env` con valores reales a Git.**

| Variable | Descripción | Requerida |
| --- | --- | --- |
| `DATABASE_URL` | Conexión a PostgreSQL (en Neon, la conexión *pooled*) | Sí |
| `DIRECT_URL` | Conexión directa a PostgreSQL, usada por las migraciones de Prisma | Sí (con Neon) |
| `JWT_SECRET` | Secreto para firmar los tokens de sesión. Usa una cadena larga y aleatoria | Sí |
| `JWT_EXPIRATION` | Duración de la sesión (por defecto `7d`) | No |
| `PORT` | Puerto HTTP (por defecto `3000`) | No |
| `NODE_ENV` | `development` o `production` | No |
| `ADMIN_API_KEY` | Llave para los endpoints de sistema (header `x-admin-key`), como el refresco del precio | Sí |
| `FNC_PRICE_URL` | Página de la FNC de donde se lee el precio del café | No |
| `GEMINI_API_KEY` | Llave de Google AI Studio. Sin ella, precio y noticias se actualizan igual, pero sin análisis | No |
| `GEMINI_MODEL` | Modelo de Gemini a usar | No |
| `COFFEE_INTEL_STALE_HOURS` | Horas tras las cuales el precio y las noticias se refrescan al consultarlos (por defecto `24`) | No |

Para las pruebas e2e se usa `backend/.env.test`, apuntando a una base de datos de pruebas (rama `e2e` de Neon), nunca a producción.

En **Render**, `DATABASE_URL`, `DIRECT_URL` y `GEMINI_API_KEY` se cargan a mano en el dashboard; `JWT_SECRET` y `ADMIN_API_KEY` los genera Render.

En **GitHub Actions** el workflow diario necesita los secretos del repositorio `API_URL` y `ADMIN_API_KEY`.

La app móvil no usa secretos: solo la URL del backend en `src/environments/`.

## Pruebas

### App

```bash
npm test -- --watch=false   # pruebas unitarias con Vitest
npm run lint                # ESLint
npm run build               # verifica que compile
```

### Backend

```bash
cd backend
npm test                    # pruebas unitarias (Jest)
npm run test:cov            # con reporte de cobertura
npm run test:e2e            # e2e contra una base real (requiere backend/.env.test)
npm run lint
```

## Capturas de pantalla

<p align="center">
  <img src="src/assets/brand/splash-sack.webp" alt="Costal de café de la pantalla de arranque" width="160" />
</p>

La app abre con una pantalla de arranque animada (ramas de café y el costal de la marca) y lleva al login, que conserva esa misma imagen en la parte superior. Las pantallas principales son: Inicio (resumen de la cosecha activa: kilos, pagos pendientes, ganancia estimada y actividad), Crear (abrir la cosecha o, si ya hay una, editarla y cerrarla), registro de pesadas, trabajadores, pagos, cierre de cosecha, historial y precio y noticias del café.

> Para agregar capturas, guárdalas en `docs/screenshots/` y enlázalas aquí.

## Contribución

1. Haz un fork o crea una rama desde `develop`: `feature/<nombre>` o `fix/<nombre>`.
2. Escribe commits en el formato [Conventional Commits](https://www.conventionalcommits.org/) (`feat(...)`, `fix(...)`, `chore(...)`).
3. Antes de abrir el PR, verifica que pasen `npm run lint`, `npm test -- --watch=false` y `npm run build` (y en `backend/`, `npm run lint` y `npm test`).
4. Abre un Pull Request hacia `develop`. `main` recibe solo lo que ya está probado en `develop`, y cada merge a `main` despliega el backend en Render.
5. Respeta los principios del producto (`PRODUCT.md`): datos reales o nada, todo debe funcionar sin señal y los textos van en español colombiano, claros y sencillos.

## Licencia

Este repositorio no incluye una licencia de código abierto. Por defecto, **todos los derechos están reservados por el autor**: puedes ver el código, pero para usarlo, modificarlo o distribuirlo necesitas su autorización.

## Autor

**ingmao** · [github.com/ingmao021](https://github.com/ingmao021)

Repositorio: [github.com/ingmao021/cosechapp](https://github.com/ingmao021/cosechapp)
