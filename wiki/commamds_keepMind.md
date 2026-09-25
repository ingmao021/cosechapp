# Comandos de Cosechapp

Guía de comandos comprobados o relacionados con la configuración actual del proyecto. Ejecutarlos desde la raíz del repositorio, salvo que se indique lo contrario.

## Preparación del proyecto

| Comando | Descripción | Estado |
| --- | --- | --- |
| `npm install` | Instala las dependencias de `package.json` y puede actualizar el lockfile. | **Necesario** |
| `npm ci` | Instala exactamente las versiones de `package-lock.json`. Es la opción recomendada para CI o una instalación reproducible. | Necesario en CI o después de clonar |
| `npm run` | Muestra los scripts disponibles en `package.json`. | Útil |
| `npm audit` | Revisa vulnerabilidades conocidas en las dependencias. | Recomendado |
| `npm audit fix` | Intenta actualizar dependencias para corregir vulnerabilidades sin cambios mayores. | Opcional; revisar los cambios |
| `npm audit fix --force` | Fuerza actualizaciones que pueden romper compatibilidad. | No ejecutar sin revisar |

No es necesario instalar Angular CLI globalmente: el proyecto usa la versión local mediante los scripts de `npm`.

## Desarrollo web

| Comando | Descripción | Estado |
| --- | --- | --- |
| `npm start` | Inicia el servidor de desarrollo Angular, normalmente en `http://localhost:4200`. | Necesario para desarrollar |
| `npm run start -- --host 0.0.0.0` | Permite acceder al servidor desde otro dispositivo de la red local. | Opcional |
| `npm run watch` | Compila en modo desarrollo y recompila al detectar cambios. | Útil |
| `npx ng serve` | Equivalente directo al servidor de Angular usando el CLI local. | Alternativo |

Para detener un servidor en ejecución se usa `Ctrl+C`.

## Compilación y validación

| Comando | Descripción | Estado |
| --- | --- | --- |
| `npm run build` | Genera la aplicación optimizada en `www/`, el directorio configurado como `webDir` de Capacitor. | **Necesario** |
| `npm run lint` | Revisa TypeScript y plantillas HTML según ESLint. | **Necesario** |
| `npm test -- --watch=false` | Ejecuta las pruebas unitarias una vez, sin observar cambios. | **Necesario** |
| `npm test` | Ejecuta las pruebas en modo interactivo. | Útil durante el desarrollo |
| `npm run build && npm run lint && npm test -- --watch=false` | Ejecuta la validación completa: compilación, lint y pruebas. | **Recomendado** |
| `npx ng extract-i18n` | Extrae los textos traducibles configurados en la aplicación. | Opcional; no es parte del flujo actual |

En la última ejecución, build y lint terminaron correctamente; las pruebas reportaron 3 exitosas y 1 omitida. La compilación mostró advertencias porque Browserslist incluye navegadores antiguos que Angular 22 ya no soporta.

## Capacitor y Android

Estos comandos se necesitan cuando se prueba o empaqueta la aplicación móvil.

| Comando | Descripción | Estado |
| --- | --- | --- |
| `npx cap sync` | Sincroniza los recursos web ya compilados, plugins y código nativo con Android. | Necesario después de cambiar dependencias o plugins |
| `npx cap copy` | Copia `www/` a los proyectos nativos sin actualizar plugins. | Alternativa para cambios solo web |
| `npx cap update android` | Actualiza las dependencias nativas de Capacitor para Android. | Opcional; usar tras cambios de versiones |
| `npx cap open android` | Abre el proyecto Android en Android Studio. | Necesario para trabajar desde Android Studio |
| `npx cap run android` | Sincroniza y ejecuta la aplicación en un emulador o dispositivo conectado. | Necesario para probar Android desde terminal |
| `npx cap build android` | Genera un artefacto Android usando Capacitor. | Necesario para empaquetar Android |
| `cd android && ./gradlew assembleDebug` | Genera el APK debug directamente con Gradle. | Alternativo |
| `cd android && ./gradlew test` | Ejecuta las pruebas unitarias Android. | Opcional |
| `cd android && ./gradlew lint` | Ejecuta el análisis lint de Android. | Recomendado antes de una entrega |
| `cd android && ./gradlew clean` | Limpia los artefactos de compilación Android. | Solo si una compilación queda inconsistente |

Flujo habitual para probar Android:

```bash
npm run build
npx cap sync android
npx cap run android
```

La ejecución Android requiere Android Studio/SDK, Java compatible y un emulador o dispositivo con depuración USB habilitada.

## Neon y backend

Necesarios al configurar la base de datos:

| Comando | Descripción | Estado |
| --- | --- | --- |
| `npm install -g neon@latest` | Instala globalmente el CLI de Neon. | Opcional; solo si se administrará Neon desde terminal |
| `neon login` | Autentica el CLI de Neon. | Necesario después de instalar el CLI |

No se deben incluir tokens, contraseñas ni archivos de credenciales en Git.

## Comandos ejecutados en este proyecto

Hasta ahora se han ejecutado correctamente:
