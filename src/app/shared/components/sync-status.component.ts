import { Component, computed, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, cloudUploadOutline, alertCircleOutline, closeOutline } from 'ionicons/icons';
import { NetworkService } from '../../network/services/network.service';
import { SyncFacade } from '../../sync/services/sync.facade';
import { HarvestFacade } from '../../harvest/services/harvest.facade';

/**
 * Aviso de trabajo sin señal (Design System §1.6, §2.6 "Datos reales o nada"):
 * - Sin conexión, con la hora de los datos que se están mostrando.
 * - Pesadas guardadas en el teléfono que faltan por enviar.
 * - Pesadas que el servidor rechazó, con el motivo.
 * No muestra nada cuando todo está al día.
 */
@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [IonIcon],
  template: `
    @if (!network.isOnline()) {
      <p class="sync-note sync-note--offline" role="status">
        <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
        <span>
          Sin conexión. Puedes seguir registrando pesadas.
          @if (savedAtLabel()) {
            Datos de las {{ savedAtLabel() }}.
          }
        </span>
      </p>
    }
    @if (sync.pendingCount() > 0) {
      <p class="sync-note" role="status">
        <ion-icon name="cloud-upload-outline" aria-hidden="true"></ion-icon>
        <span>
          {{ sync.pendingCount() }} {{ sync.pendingCount() === 1 ? 'pesada' : 'pesadas' }} por enviar.
          Se enviarán solas al volver la señal.
        </span>
      </p>
    }
    @if (sync.rejected().length > 0) {
      <div class="sync-note sync-note--error" role="alert">
        <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
        <div class="sync-note__body">
          <span>No se pudieron guardar {{ sync.rejected().length }} {{ sync.rejected().length === 1 ? 'pesada' : 'pesadas' }}:</span>
          <ul>
            @for (item of sync.rejected(); track item.id) {
              <li>{{ item.kilograms }} kg — {{ item.reason }}</li>
            }
          </ul>
        </div>
        <button type="button" class="sync-note__close" (click)="sync.dismissRejected()" aria-label="Entendido">
          <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .sync-note {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      margin: 0;
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-sm);
      background: rgba(50, 89, 27, 0.08);
      color: var(--color-text);
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      line-height: 1.4;
    }
    .sync-note ion-icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--color-primary);
    }
    .sync-note--offline {
      background: rgba(183, 121, 31, 0.12);
    }
    .sync-note--offline ion-icon {
      color: var(--ion-color-warning);
    }
    .sync-note--error {
      background: rgba(122, 46, 34, 0.08);
      color: var(--color-accent-alert);
    }
    .sync-note--error ion-icon {
      color: var(--color-accent-alert);
    }
    .sync-note__body {
      flex: 1;
    }
    .sync-note__body ul {
      margin: var(--spacing-xs) 0 0;
      padding-left: var(--spacing-md);
    }
    .sync-note__close {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: var(--touch-target-min);
      min-height: var(--touch-target-min);
      margin: calc(var(--spacing-sm) * -1) calc(var(--spacing-md) * -1) 0 0;
      border: none;
      background: transparent;
      cursor: pointer;
    }
  `],
})
export class SyncStatusComponent {
  protected readonly network = inject(NetworkService);
  protected readonly sync = inject(SyncFacade);
  private readonly harvestFacade = inject(HarvestFacade);

  protected readonly savedAtLabel = computed(() => {
    const savedAt = this.harvestFacade.dataSavedAt();
    return savedAt ? new Date(savedAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : null;
  });

  constructor() {
    addIcons({ cloudOfflineOutline, cloudUploadOutline, alertCircleOutline, closeOutline });
  }
}
