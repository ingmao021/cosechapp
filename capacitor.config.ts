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
    // Splash nativo: el logo (ícono de la app sobre blanco) es lo único que se ve al abrir.
    // Sigue visible mientras SplashPage verifica la sesión y lo oculta al navegar a Login o Inicio.
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false, // lo oculta SplashPage
      backgroundColor: '#FFFFFF',
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