import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { addIcons } from 'ionicons';
import { scaleOutline, addOutline, closeOutline, pricetagOutline, addCircleOutline, cloudDoneOutline, cloudOfflineOutline, cloudUploadOutline, ellipsisVertical, createOutline, trashOutline } from 'ionicons/icons';
import { ActionSheetController } from '@ionic/angular/action-sheet-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { apiErrorMessage } from '../../shared/utils';
import { HarvestFacade } from '../services/harvest.facade';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';
import { NetworkService } from '../../network/services/network.service';
import { SyncFacade } from '../../sync/services/sync.facade';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

/**
 * Pantalla Inicio (Home) — Cosecha activa.
 * Tarea 2.2: Conecta con HarvestFacade para mostrar datos reales.
 * Contenido según Design System 1.2:
 * - Header organismo: nombre cosecha + precio/kilo + menú ⋮ (editar / eliminar) + "Cerrar cosecha"
 * - Si no hay cosecha: invitación a abrir nueva
 * - Precio FNC actual con fecha (placeholder - se conectará en Tarea 6.1)
 * - Indicador sincronización (placeholder - se conectará en Tarea 8)
 * - Botón "Pesar" → /harvest/crews
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    CurrencyPipe,
    DateFormatPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">CosechApp</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (harvestFacade.hasActiveHarvest()) {
        <!-- Cosecha activa -->
        <ion-card class="harvest-header-card">
          <ion-card-header class="harvest-header">
            <div class="harvest-header__text">
              <ion-card-title class="text-level-2">{{ harvestFacade.activeHarvestName() }}</ion-card-title>
              <ion-card-subtitle class="text-level-4">
                Pagas {{ harvestFacade.activeHarvestPrice() | currency }} por kilo
              </ion-card-subtitle>
            </div>
            <ion-button fill="clear" color="medium" class="harvest-header__menu" aria-label="Opciones de la cosecha" (click)="openHarvestMenu()">
              <ion-icon name="ellipsis-vertical" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-card-header>
          <ion-card-content>
            <!-- Solo datos reales: estado de conexión y precio FNC si existe -->
            <div class="status-row">
              @if (sync.pendingCount() > 0) {
                <span class="status-pill status-pill--offline">
                  <ion-icon name="cloud-upload-outline" aria-hidden="true"></ion-icon>
                  {{ sync.pendingCount() }} {{ sync.pendingCount() === 1 ? 'pesada' : 'pesadas' }} por enviar
                </span>
              } @else if (!network.isOnline()) {
                <span class="status-pill status-pill--offline">
                  <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
                  Sin conexión · se guarda en el teléfono
                </span>
              } @else if (sync.lastSync()) {
                <span class="status-pill">
                  <ion-icon name="cloud-done-outline" aria-hidden="true"></ion-icon>
                  Todo enviado · {{ sync.lastSync() | dateFormat: 'time' }}
                </span>
              } @else {
                <span class="status-pill">
                  <ion-icon name="cloud-done-outline" aria-hidden="true"></ion-icon>
                  En línea
                </span>
              }
              @if (priceAndNewsFacade.hasPrice()) {
                <span class="status-pill">
                  <ion-icon name="pricetag-outline" aria-hidden="true"></ion-icon>
                  FNC {{ priceAndNewsFacade.formattedPrice() }} · {{ priceAndNewsFacade.priceDate() }}
                </span>
              }
            </div>
            <div class="main-actions">
              <ion-button expand="block" fill="solid" color="primary" class="weigh-btn" (click)="goToWeigh()">
                <ion-icon name="scale-outline" slot="start"></ion-icon>
                Pesar
              </ion-button>
              <ion-button expand="block" fill="outline" color="danger" class="close-harvest-btn" (click)="goToCloseHarvest()">
                <ion-icon name="close-outline" slot="start"></ion-icon>
                Cerrar cosecha
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      } @else {
        <!-- Estado vacío: no hay cosecha activa -->
        <ion-card class="empty-state-card">
          <ion-card-content class="text-center">
            <ion-icon name="add-circle-outline" size="large" color="primary"></ion-icon>
            <h2 class="text-level-2 ion-margin-top">No hay cosecha activa</h2>
            <p class="text-level-4 ion-margin">Abre una nueva cosecha para empezar a registrar pesadas.</p>
            <ion-button fill="solid" color="primary" class="ion-margin-top" (click)="openHarvest()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Abrir nueva cosecha
            </ion-button>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .harvest-header-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
    }
    .harvest-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-sm);
    }
    .harvest-header__text {
      flex: 1;
      min-width: 0;
    }
    .harvest-header__menu {
      margin: -8px -8px 0 0;
    }
    .status-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    /* Etiqueta informativa, no interactiva (no usa ion-chip para no parecer botón). */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-full);
      background: var(--color-background);
      color: var(--color-text);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
    }
    .status-pill ion-icon {
      font-size: 16px;
      color: var(--color-primary);
    }
    .status-pill--offline {
      background: rgba(183, 121, 31, 0.12);
    }
    .status-pill--offline ion-icon {
      color: var(--ion-color-warning);
    }
    .main-actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .weigh-btn {
      --border-radius: var(--radius-full);
      height: 56px;
      min-height: 56px;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
    }
    .close-harvest-btn {
      --border-radius: var(--radius-full);
      height: 48px;
      min-height: 48px;
    }
    .empty-state-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      text-align: center;
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class HomePage {
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly priceAndNewsFacade = inject(PriceAndNewsFacade);
  protected readonly network = inject(NetworkService);
  protected readonly sync = inject(SyncFacade);
  private readonly router = inject(Router);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ scaleOutline, addOutline, closeOutline, pricetagOutline, addCircleOutline, cloudDoneOutline, cloudOfflineOutline, cloudUploadOutline, ellipsisVertical, createOutline, trashOutline });

    // Cargar cosecha activa y precio FNC al inicializar
    effect(() => {
      this.harvestFacade.loadActiveHarvest();
      this.priceAndNewsFacade.loadCoffeePrice();
    });
  }

  goToWeigh(): void {
    // Navegar a cuadrillas para pesar
    this.router.navigate(['/harvest/crews']);
  }

  goToCloseHarvest(): void {
    // Navegar a pantalla de cierre de cosecha (venta + costos)
    this.router.navigate(['/harvest/close']);
  }

  openHarvest(): void {
    // Navegar a página para abrir nueva cosecha
    this.router.navigate(['/harvest/open']);
  }

  /** ⋮ de la cosecha: corregirla o eliminarla si se creó por error (sin cerrarla). */
  async openHarvestMenu(): Promise<void> {
    const sheet = await this.actionSheetController.create({
      header: this.harvestFacade.activeHarvestName(),
      buttons: [
        { text: 'Editar cosecha', icon: 'create-outline', handler: () => void this.editHarvest() },
        { text: 'Eliminar cosecha', icon: 'trash-outline', role: 'destructive', handler: () => void this.confirmDeleteHarvest() },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async editHarvest(): Promise<void> {
    const harvest = this.harvestFacade.activeHarvest();
    if (!harvest) return;
    const alert = await this.alertController.create({
      header: 'Editar cosecha',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre de la cosecha', value: harvest.name, attributes: { maxlength: 100, autocapitalize: 'sentences' } },
        { name: 'price', type: 'number', placeholder: 'Precio por kilo', value: harvest.pricePerKilogram, min: 1, attributes: { inputmode: 'numeric' } },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data: { name: string; price: string }) => {
            const name = data.name?.trim();
            const price = Number(data.price);
            if (!name || !(price > 0)) return false; // mantiene el diálogo abierto
            void this.saveHarvest(name, price);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async saveHarvest(name: string, pricePerKilogram: number): Promise<void> {
    try {
      await this.harvestFacade.updateHarvest({ name, pricePerKilogram });
      await this.toast('Cosecha actualizada.', 'success');
    } catch (err: unknown) {
      await this.toast(apiErrorMessage(err, 'No se pudo actualizar la cosecha.'), 'danger');
    }
  }

  private async confirmDeleteHarvest(): Promise<void> {
    const alert = await this.alertController.create({
      header: '¿Eliminar la cosecha?',
      message: `Se elimina "${this.harvestFacade.activeHarvestName()}" con sus cuadrillas. Solo se puede si aún no tiene pesadas ni pagos.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;
    try {
      await this.harvestFacade.deleteHarvest();
      await this.toast('Cosecha eliminada.', 'success');
    } catch (err: unknown) {
      await this.toast(apiErrorMessage(err, 'No se pudo eliminar la cosecha.'), 'danger');
    }
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}