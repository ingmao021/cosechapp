import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
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
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { EmptyStateComponent } from '@shared/components';

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
    IonSkeletonText,
    EmptyStateComponent,
    CurrencyPipe,
    DateFormatPipe,
    KilosPipe,
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
        <ion-card class="harvest-card">
          <div class="harvest-card__head">
            <div class="harvest-card__title">
              <h2>{{ harvestFacade.activeHarvestName() }}</h2>
              <p class="harvest-card__price">
                Pagas <span class="num">{{ harvestFacade.activeHarvestPrice() | currency }}</span> por kilo
              </p>
            </div>
            <ion-button fill="clear" color="medium" class="harvest-card__menu" aria-label="Opciones de la cosecha" (click)="openHarvestMenu()">
              <ion-icon name="ellipsis-vertical" slot="icon-only"></ion-icon>
            </ion-button>
          </div>

          <!-- Resumen del día: solo datos reales de la cosecha cargada. -->
          <dl class="stats">
            <div class="stat">
              <dt>Kilos hoy</dt>
              <dd class="num">{{ todayKilograms() | kilos }}</dd>
            </div>
            <div class="stat">
              <dt>Recolectores</dt>
              <dd class="num">{{ activePickers() }}</dd>
            </div>
          </dl>

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
        </ion-card>
      } @else if (harvestFacade.isLoading()) {
        <!-- Primera carga: la forma de la tarjeta, sin pasar antes por "No hay cosecha activa". -->
        <div class="harvest-card harvest-card--skeleton" role="status" aria-label="Cargando cosecha">
          <ion-skeleton-text [animated]="true" class="sk sk--title"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--line"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--stats"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--button"></ion-skeleton-text>
        </div>
      } @else {
        <app-empty-state icon="add-circle-outline" title="No hay cosecha activa">
          <p>Abre una nueva cosecha para empezar a registrar pesadas.</p>
          <ion-button fill="solid" color="primary" (click)="openHarvest()">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Abrir nueva cosecha
          </ion-button>
        </app-empty-state>
      }
    </ion-content>
  `,
  styles: [`
    .harvest-card {
      --background: var(--color-surface);
      --card-shadow: var(--shadow-raised);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      min-height: 0;
      margin: 0 0 var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-md) var(--spacing-md);
    }
    .harvest-card__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-sm);
    }
    .harvest-card__title {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .harvest-card__title p,
    .harvest-card__title h2 {
      margin: 0;
    }
    .harvest-card__title h2 {
      font-family: var(--font-family-display);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
      line-height: 1.15;
      overflow-wrap: anywhere;
    }
    .harvest-card__price {
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .harvest-card__price .num {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }
    .harvest-card__menu {
      margin: -8px -12px 0 0;
    }
    /* Las cifras del día van en una fila con líneas finas arriba y abajo, como un
       renglón del cuaderno: sin tarjetas dentro de la tarjeta. */
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin: 0;
      padding: var(--spacing-sm) 0;
      border-block: 1px solid rgba(43, 36, 32, 0.08);
    }
    .stat {
      min-width: 0;
      padding: var(--spacing-xs) 0;
    }
    .stat + .stat {
      padding-left: var(--spacing-md);
      border-left: 1px solid rgba(43, 36, 32, 0.08);
    }
    .stat dt {
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }
    .stat dd {
      margin: 2px 0 0;
      font-family: var(--font-family-display);
      font-size: var(--font-size-xl);
      line-height: 1.1;
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    /* Etiqueta informativa, no interactiva (no usa ion-chip para no parecer botón). */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      max-width: 100%;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-full);
      background: var(--color-primary-soft);
      color: var(--color-text);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
    }
    .status-pill ion-icon {
      flex-shrink: 0;
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
    .main-actions ion-button {
      margin: 0;
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
    .harvest-card--skeleton {
      gap: var(--spacing-sm);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .sk {
      --background: rgba(43, 36, 32, 0.07);
      --background-rgb: 43, 36, 32;
      margin: 0;
      border-radius: var(--radius-sm);
    }
    .sk--title { width: 65%; height: 26px; }
    .sk--line { width: 45%; height: 14px; }
    .sk--stats { width: 100%; height: 64px; margin-top: var(--spacing-sm); border-radius: var(--radius-md); }
    .sk--button { width: 100%; height: 56px; margin-top: var(--spacing-sm); border-radius: var(--radius-full); }
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

  private readonly activeHarvestPickers = computed(() =>
    this.harvestFacade.activeHarvestPickers().filter((picker) => picker.status === 'active'),
  );
  readonly activePickers = computed(() => this.activeHarvestPickers().length);
  readonly todayKilograms = computed(() =>
    this.activeHarvestPickers().reduce((total, picker) => total + picker.todayKilograms, 0),
  );
  /** Kilos de toda la cosecha, incluidos los de recolectores ya quitados y las pesadas sin enviar. */
  private readonly harvestKilograms = computed(() =>
    this.harvestFacade.activeHarvestPickers().reduce((total, picker) => total + picker.totalKilograms, 0),
  );

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

  /** Sin kilos pesados no hay nada que pagar ni vender: se avisa en lugar de abrir el cierre. */
  goToCloseHarvest(): void {
    if (this.harvestKilograms() > 0) {
      this.router.navigate(['/harvest/close']);
      return;
    }
    void this.warnNoKilograms();
  }

  private async warnNoKilograms(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Aún no hay kilos pesados',
      message: `"${this.harvestFacade.activeHarvestName()}" no tiene pesadas. Registra al menos una antes de cerrarla; si la abriste por error, puedes eliminarla desde el menú de opciones de la cosecha.`,
      buttons: [
        { text: 'Entendido', role: 'cancel' },
        { text: 'Ir a pesar', role: 'confirm', handler: () => this.goToWeigh() },
      ],
    });
    await alert.present();
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