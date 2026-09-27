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
    // Splash nativo con Cosech.png (object-fit: cover centrado)
    SplashScreen: {
      launchShowDuration: 0, // duramos lo que tarde la verificación de sesión
      launchAutoHide: false, // lo ocultamos manualmente desde el código tras verificar sesión
      backgroundColor: '#F2EFF2', // color de marca mientras carga
      androidScaleType: 'CENTER_CROP', // object-fit: cover centrado
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