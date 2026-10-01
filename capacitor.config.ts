import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'CosechApp',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // Splash nativo: fondo blanco liso que cubre el arranque del WebView. La animación
    // de marca (CosechAPP_animado.svg) la muestra SplashPage, que oculta este splash
    // cuando el SVG está listo; ambos son blancos, así que el relevo no se nota.
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false, // lo oculta SplashPage
      backgroundColor: '#FFFFFF', // mismo blanco con el que arranca el SVG
      splashFullScreen: true,
      splashImmersive: true,
    },
    // SecureStorage para JWT (AES-GCM + Android Keystore)
    SecureStorage: {
      // configuración por defecto OK
    },
    // Network para detección de conectividad
    Network: {
      // configuración por defecto OK
    },
    // Push Notifications (FCM) para alertas de precio FNC
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // SQLite para almacenamiento offline (fase 5)
    SQLite: {
      databaseName: 'cosechapp.db',
      version: 1,
      encrypted: false, // por ahora sin cifrar; evaluar SQLCipher si escala
      mode: 'no-encryption',
      readonly: false,
    },
  },
};

export default config;