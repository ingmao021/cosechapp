import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { SqliteService, SyncQueueItem } from './sqlite.service';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Facade de Sincronización — Estado (Signals) + Orquestación offline-first.
 *
 * Expone signals de solo lectura:
 * - isOnline: boolean (estado de red)
 * - isSyncing: boolean (sincronizando)
 * - pendingCount: number (items en cola)
 * - lastSync: Date | null
 * - syncError: string | null
 *
 * Métodos:
 * - initialize(): inicializa SQLite, red y push notifications
 * - queueOperation(): encola operación para sincronización
 * - syncAll(): procesa cola de sincronización
 * - setupPushNotifications(): configura FCM
 */
@Injectable({ providedIn: 'root' })
export class SyncFacade {
  private readonly sqlite = inject(SqliteService);

  // Estado de red
  readonly isOnline = signal(true);

  // Estado de sincronización
  readonly isSyncing = signal(false);
  readonly pendingCount = signal(0);
  readonly lastSync = signal<Date | null>(null);
  readonly syncError = signal<string | null>(null);

  // Push notifications
  readonly fcmToken = signal<string | null>(null);
  readonly pushPermission = signal<'granted' | 'denied' | 'prompt'>('prompt');

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa todo: SQLite, detección de red, push notifications
   */
  async initialize(): Promise<void> {
    try {
      // 1. Inicializar SQLite
      await this.sqlite.initialize();

      // 2. Configurar detección de red
      await this.setupNetworkListener();

      // 3. Obtener estado inicial de red
      const status = await Network.getStatus();
      this.isOnline.set(status.connected ?? true);

      // 4. Cargar contador pendiente
      this.pendingCount.set(await this.sqlite.getPendingSyncCount());

      // 5. Configurar push notifications
      await this.setupPushNotifications();

      // 6. Effect para sincronizar automáticamente al recuperar conexión
      effect(() => {
        if (this.isOnline() && this.pendingCount() > 0 && !this.isSyncing()) {
          this.syncAll();
        }
      });

      console.log('SyncFacade inicializado');
    } catch (error) {
      console.error('Error inicializando SyncFacade:', error);
    }
  }

  /**
   * Configura listener de cambios de red
   */
  private async setupNetworkListener(): Promise<void> {
    Network.addListener('networkStatusChange', (status) => {
      const wasOffline = !this.isOnline();
      this.isOnline.set(status.connected ?? true);

      if (wasOffline && status.connected) {
        console.log('Conexión restaurada - sincronizando...');
        this.syncAll();
      } else if (!status.connected) {
        console.log('Sin conexión - modo offline');
      }
    });
  }

  /**
   * Configura push notifications (FCM)
   */
  private async setupPushNotifications(): Promise<void> {
    try {
      // Solicitar permisos
      const permResult = await PushNotifications.requestPermissions();
      this.pushPermission.set(permResult.receive as 'granted' | 'denied' | 'prompt');

      if (permResult.receive === 'granted') {
        // Registrar para recibir notificaciones
        await PushNotifications.register();

        // Listener para token FCM
        PushNotifications.addListener('registration', (token) => {
          this.fcmToken.set(token.value);
          console.log('FCM Token:', token.value);
          // TODO: Enviar token al backend
        });

        // Listener para errores de registro
        PushNotifications.addListener('registrationError', (err) => {
          console.error('Error registro FCM:', err.error);
        });

        // Listener para notificaciones recibidas
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push recibido:', notification);
          // Actualizar precio local si es notificación de precio
          if (notification.data?.type === 'price_change') {
            // TODO: Actualizar PriceAndNewsFacade local
          }
        });

        // Listener para acción en notificación
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Acción en notificación:', action);
          // Navegar según acción
        });
      }
    } catch (error) {
      console.error('Error configurando push notifications:', error);
    }
  }

  /**
   * Encola una operación para sincronización posterior
   */
  async queueOperation(
    entity: string,
    operation: 'create' | 'update' | 'delete',
    entityId: string,
    data: any
  ): Promise<void> {
    const item = {
      entity,
      operation,
      entityId,
      data: JSON.stringify(data),
      timestamp: Date.now(),
      retryCount: 0,
    };
    await this.sqlite.addToSyncQueue(item);
    this.pendingCount.set(await this.sqlite.getPendingSyncCount());
  }

  /**
   * Procesa toda la cola de sincronización
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing() || !this.isOnline()) return;

    this.isSyncing.set(true);
    this.syncError.set(null);

    try {
      const items = await this.sqlite.getPendingSyncItems(50);

      for (const item of items) {
        if (!this.isOnline()) break;

        try {
          await this.processSyncItem(item);
          await this.sqlite.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Error sincronizando item ${item.id}:`, error);
          await this.sqlite.incrementRetryCount(item.id);
        }

        this.pendingCount.set(await this.sqlite.getPendingSyncCount());
      }

      this.lastSync.set(new Date());
      this.pendingCount.set(await this.sqlite.getPendingSyncCount());
    } catch (error) {
      this.syncError.set(error instanceof Error ? error.message : 'Error de sincronización');
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Procesa un item individual de la cola
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const data = JSON.parse(item.data);
    const baseUrl = 'http://localhost:3000'; // TODO: desde environment

    let url = `${baseUrl}/${item.entity}`;
    let method: 'POST' | 'PUT' | 'DELETE' = 'POST';

    switch (item.operation) {
      case 'create':
        method = 'POST';
        break;
      case 'update':
        method = 'PUT';
        url = `${url}/${item.entityId}`;
        break;
      case 'delete':
        method = 'DELETE';
        url = `${url}/${item.entityId}`;
        break;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // TODO: agregar Authorization header con JWT
      },
      body: item.operation !== 'delete' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync failed: ${response.status} ${errorText}`);
    }

    // Si fue exitoso, marcar entidad local como sincronizada
    // TODO: implementar según entidad
  }

  /**
   * Fuerza sincronización manual (pull-to-refresh)
   */
  async forceSync(): Promise<void> {
    await this.syncAll();
  }

  /**
   * Limpia items antiguos de la cola (reintentos agotados)
   */
  async cleanupSyncQueue(): Promise<void> {
    await this.sqlite.clearSyncedQueue();
    this.pendingCount.set(await this.sqlite.getPendingSyncCount());
  }
}