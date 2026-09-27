import { Injectable, signal, computed } from '@angular/core';
import { Network } from '@capacitor/network';

/**
 * Servicio de red - Detección de conectividad
 * Expone signals reactivos para estado de red
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly isOnline = signal(true);
  readonly connectionType = signal<'wifi' | 'cellular' | 'none' | 'unknown'>('unknown');

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Estado inicial
      const status = await Network.getStatus();
      this.isOnline.set(status.connected ?? true);
      this.connectionType.set(status.connectionType ?? 'unknown');

      // Listener para cambios
      Network.addListener('networkStatusChange', (status) => {
        this.isOnline.set(status.connected ?? true);
        this.connectionType.set(status.connectionType ?? 'unknown');
      });
    } catch (error) {
      console.error('Error inicializando NetworkService:', error);
    }
  }

  // Computed para conveniencia
  readonly isWifi = computed(() => this.connectionType() === 'wifi');
  readonly isCellular = computed(() => this.connectionType() === 'cellular');
  readonly isOffline = computed(() => !this.isOnline());
}