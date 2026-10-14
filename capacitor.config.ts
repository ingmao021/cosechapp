import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'CosechApp',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // Splash nativo: solo un instante en blanco. SplashPage lo oculta al cargar y muestra
    // el arranque animado (fondo de café + costal) mientras verifica la sesión.
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false, // lo oculta SplashPage
      backgroundColor: '#FFFFFF',
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Barra de estado con íconos oscuros sobre el header blanco: se lee como parte de la app.
    // En Android 15+ (edge-to-edge) el color de fondo lo pone la app; el estilo sí aplica.
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false,
    },
    // SecureStorage para JWT (AES-GCM + Android Keystore)
    SecureStorage: {
      // configuración por defecto OK
    },
    // Network para detección de conectividad
    Network: {
      // configuración por defecto OK
    },
  },
};

export default config;