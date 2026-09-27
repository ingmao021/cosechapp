import { Injectable, signal } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface FCMToken {
  token: string;
  timestamp: number;
}

/**
 * Servicio de Push Notifications (FCM)
 * Maneja registro, permisos y recepción de notificaciones
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  readonly fcmToken = signal<string | null>(null);
  readonly permission = signal<'granted' | 'denied' | 'prompt'>('prompt');
  readonly lastNotification = signal<PushNotification | null>(null);

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Solicitar permisos al inicio
      const permResult = await PushNotifications.requestPermissions();
      this.permission.set(permResult.receive as 'granted' | 'denied' | 'prompt');

      if (permResult.receive === 'granted') {
        await this.register();
      }

      // Listeners
      this.setupListeners();
    } catch (error) {
      console.error('Error inicializando PushNotificationService:', error);
    }
  }

  /**
   * Registra el dispositivo para push notifications
   */
  async register(): Promise<void> {
    try {
      await PushNotifications.register();
    } catch (error) {
      console.error('Error registrando push notifications:', error);
    }
  }

  /**
   * Configura listeners de push notifications
   */
  private setupListeners(): void {
    // Token FCM recibido
    PushNotifications.addListener('registration', (token) => {
      this.fcmToken.set(token.value);
      console.log('FCM Token recibido:', token.value);
      // TODO: Enviar token al backend
    });

    // Error en registro
    PushNotifications.addListener('registrationError', (err) => {
      console.error('Error registro FCM:', err.error);
    });

    // Notificación recibida en foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push recibido (foreground):', notification);

      const pushNotification: PushNotification = {
        title: notification.title ?? '',
        body: notification.body ?? '',
        data: notification.data,
      };

      this.lastNotification.set(pushNotification);

      // Manejar según tipo de notificación
      if (notification.data?.type === 'price_change') {
        // Emitir evento para actualizar precio local
        window.dispatchEvent(new CustomEvent('priceChange', {
          detail: notification.data
        }));
      }
    });

    // Usuario toca la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Acción en notificación:', action);
      // Navegación basada en action
      const data = action.notification.data;

      if (data?.type === 'price_change') {
        // Navegar a pestaña de precio
        window.location.href = '/price-and-news';
      }
    });
  }

  /**
   * Solicita permisos manualmente
   */
  async requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    const result = await PushNotifications.requestPermissions();
    this.permission.set(result.receive as 'granted' | 'denied' | 'prompt');
    return result.receive as 'granted' | 'denied' | 'prompt';
  }

  /**
   * Obtiene el token FCM actual (o lo refresca)
   */
  async getToken(): Promise<string | null> {
    if (!this.fcmToken()) {
      await this.register();
    }
    return this.fcmToken();
  }

  /**
   * Verifica si tiene permisos
   */
  hasPermission(): boolean {
    return this.permission() === 'granted';
  }

  /**
   * Limpia la última notificación
   */
  clearLastNotification(): void {
    this.lastNotification.set(null);
  }
}