<div align="center">

<img src="./src/assets/brand/logo.png" alt="CosechApp logo" width="420" />

# ☕ CosechApp

**Pesadas y pagos de tu cosecha de café, con o sin señal**

![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-9-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

[![Descargar APK](https://img.shields.io/badge/Descargar-APK-79A636?style=for-the-badge&logo=android&logoColor=white)](https://github.com/ingmao021/cosechapp/releases/latest/download/CosechApp.apk)

</div>

---

## ☕ ¿Qué es?

App Android para caficultores colombianos que reemplaza el cuaderno de la recolección: registra las pesadas de cada recolector, calcula lo que se le debe pagar y muestra cuánto dejó realmente cada cosecha. Pensada para usarse a pleno sol y **sin conexión**.

## ✨ Características

- 🔐 **Acceso con cédula y contraseña**, sin correo ni teléfono.
- 🌱 **Cosechas** con nombre propio (pasón, mitaca…) e historial.
- ⚖️ **Pesadas ilimitadas** por recolector y por día.
- 📴 **Funciona sin señal:** guarda en el teléfono y sincroniza solo al volver la conexión.
- 💵 **Pagos** inmediatos o liquidación final, con la alimentación descontada.
- 📊 **Ganancia bruta y real**, con venta y costos de producción.
- 📰 **Precio oficial FNC** y noticias del café resumidas con IA (Gemini).

## 🚀 Instalación rápida

**Requisitos:** [Node.js 24](https://nodejs.org), Git y una base de datos PostgreSQL (recomendado: [Neon](https://neon.tech), plan gratuito). Para el APK: Android Studio y JDK 21.

**1. Clonar e instalar**

```bash
git clone https://github.com/ingmao021/cosechapp.git
cd cosechapp
npm ci                      # app
cd backend && npm ci        # backend (genera el cliente de Prisma)
```

**2. Configurar el backend**

```bash
cp .env.example .env        # dentro de backend/
```

Abre `backend/.env` y completa al menos estas tres variables:

| Variable        | Qué poner                           |
| --------------- | ----------------------------------- |
| `DATABASE_URL`  | Cadena de conexión de tu PostgreSQL |
| `JWT_SECRET`    | Una cadena larga y aleatoria        |
| `ADMIN_API_KEY` | Otra cadena larga y aleatoria       |

> `GEMINI_API_KEY` es opcional: sin ella todo funciona, solo se omite el análisis con IA.

**3. Crear las tablas y arrancar el backend**

```bash
npx prisma migrate deploy
npm run start:dev           # http://localhost:3000  (prueba: /health)
```

**4. Abrir la app** (en otra terminal, desde la raíz del proyecto)

```bash
npm start                   # http://localhost:4200
```

> En desarrollo la app ya apunta a `http://localhost:3000` (`src/environments/environment.ts`).

## 📱 Correr en Android

```bash
npm run build               # compila la app web a www/
npx cap sync android        # copia la web y los plugins al proyecto nativo
npx cap run android         # instala en el emulador o teléfono conectado
```

> La build de producción apunta al backend desplegado en Render. Para usar tu backend local, cambia `apiUrl` en `src/environments/environment.prod.ts`.

¿Solo quieres probarla? Descarga el [APK más reciente](https://github.com/ingmao021/cosechapp/releases/latest/download/CosechApp.apk).

## 🧪 Pruebas

```bash
npm test -- --watch=false   # app (Vitest)
npm run lint                # app (ESLint)
cd backend && npm test      # backend (Jest)
```

## 🗂️ Estructura

```text
cosechapp/
├── src/        # App Ionic + Angular (auth, harvest, weighing, payment, sync…)
├── backend/    # API NestJS · arquitectura hexagonal · Prisma + PostgreSQL
├── android/    # Proyecto nativo generado por Capacitor
├── wiki/       # PRD, Design System y guías
└── .github/    # CI: release del APK y actualización diaria de precio y noticias
```

## 🤝 Contribuir

Crea una rama `feature/<nombre>` o `fix/<nombre>` desde `develop`, usa [Conventional Commits](https://www.conventionalcommits.org/) y abre el Pull Request hacia `develop`. Antes, verifica que pasen `lint`, `test` y `build`.

## 📄 Licencia y autor

Todos los derechos reservados. Para usar, modificar o distribuir el código se necesita autorización del autor.

**ingmao** · [github.com/ingmao021](https://github.com/ingmao021)
