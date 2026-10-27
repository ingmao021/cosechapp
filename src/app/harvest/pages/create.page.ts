import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ActionSheetController } from '@ionic/angular/action-sheet-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  arrowForward,
  closeCircleOutline,
  createOutline,
  ellipsisVertical,
  informationCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { AppButtonPrimaryComponent, AppInputComponent } from '@shared/components';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { apiErrorMessage, parseInteger } from '../../shared/utils';
import { HarvestFacade } from '../services/harvest.facade';
import { DashboardFacade } from '../services/dashboard.facade';
import { NetworkService } from '../../network/services/network.service';

/**
 * Crear — sección propia de la barra inferior (Design System §1.2.1), en /create.
 * - Sin cosecha activa: el formulario para abrirla (nombre libre y precio por kilo).
 * - Con cosecha activa: su estado y el aviso de que solo puede haber una abierta. Aquí
 *   vive el ciclo de vida de la cosecha: ir a ella, editarla o eliminarla (menú ⋮) y cerrarla.
 */
@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonSkeletonText,
    AppInputComponent,
    AppButtonPrimaryComponent,
    CurrencyPipe,
    DateFormatPipe,
    KilosPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Crear</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (harvestFacade.hasActiveHarvest()) {
        <div class="page">
          <section class="card harvest" aria-labelledby="harvest-name">
            <div class="harvest__head">
              <div class="harvest__title">
                <p class="eyebrow">Cosecha abierta</p>
                <h2 id="harvest-name">{{ harvestFacade.activeHarvestName() }}</h2>
                <p class="harvest__meta">
                  Día <span class="num">{{ dashboard.harvestDay() }}</span> · abierta el {{ harvestFacade.activeHarvest()!.openingDate | dateFormat: 'date' }}
                </p>
              </div>
              <ion-button
                fill="clear"
                color="medium"
                class="harvest__menu"
                aria-label="Opciones de la cosecha"
                [disabled]="!network.isOnline()"
                (click)="openHarvestMenu()"
              >
                <ion-icon name="ellipsis-vertical" slot="icon-only"></ion-icon>
              </ion-button>
            </div>

            <dl class="facts">
              <div class="fact">
                <dt>Pagas por kilo</dt>
                <dd class="num">{{ harvestFacade.activeHarvestPrice() | currency: true : false }}</dd>
              </div>
              <div class="fact">
                <dt>Kilos recogidos</dt>
                <dd class="num">{{ dashboard.totalKilograms() | kilos }}</dd>
              </div>
              <div class="fact">
                <dt>Recolectores</dt>
                <dd class="num">{{ activePickers() }}</dd>
              </div>
            </dl>

            <ion-button expand="block" fill="solid" color="primary" class="go-btn" (click)="goToHarvest()">
              Ir a la cosecha
              <ion-icon name="arrow-forward" slot="end" aria-hidden="true"></ion-icon>
            </ion-button>
          </section>

          <p class="notice">
            <ion-icon name="information-circle-outline" aria-hidden="true"></ion-icon>
            <span>Solo puede haber una cosecha abierta a la vez. Para abrir otra, cierra esta: al cerrarla se les paga a todos los recolectores y luego registras la venta y los costos.</span>
          </p>

          <!-- Salida poco frecuente y de alto impacto: texto rojo, sin el peso de un botón. -->
          <ion-button
            expand="block"
            fill="clear"
            color="danger"
            class="close-btn"
            [disabled]="!network.isOnline()"
            (click)="goToCloseHarvest()"
          >
            <ion-icon name="close-circle-outline" slot="start" aria-hidden="true"></ion-icon>
            Cerrar cosecha
          </ion-button>
          @if (!network.isOnline()) {
            <p class="hint">Necesitas conexión para editar, eliminar o cerrar la cosecha.</p>
          }
        </div>
      } @else if (harvestFacade.isLoading() && !loaded()) {
        <div class="page" role="status" aria-label="Cargando">
          <div class="card harvest">
            <ion-skeleton-text [animated]="true" class="sk sk--title"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" class="sk sk--line"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" class="sk sk--block"></ion-skeleton-text>
          </div>
        </div>
      } @else {
        <form class="form-page" (ngSubmit)="onOpenHarvest()" #form="ngForm" novalidate>
          <p class="form-page__intro">
            Abre una cosecha: dale un nombre y define cuánto pagas por kilo recogido.
          </p>

          <div class="form-page__fields">
            <app-input
              label="Nombre de la cosecha"
              name="name"
              [(ngModel)]="name"
              required
              maxlength="100"
              placeholder="Ej: Primer pasón, Mitaca 2026"
              errorMessage="Escribe un nombre para la cosecha."
              autocapitalize="sentences"
              enterkeyhint="next"
            ></app-input>

            <app-input
              label="Precio por kilo (COP)"
              type="integer"
              name="pricePerKilogram"
              [(ngModel)]="pricePerKilogram"
              required
              enterkeyhint="done"
              inputmode="numeric"
              placeholder="Ej: 1200"
              helperText="Lo que pagas al recolector por cada kilo de café cereza."
              errorMessage="Escribe el precio por kilo."
            ></app-input>
          </div>

          @if (errorMessage()) {
            <p class="form-error" role="alert">
              <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
              <span>{{ errorMessage() }}</span>
            </p>
          }

          <app-button-primary
            type="submit"
            [loading]="isSubmitting()"
            [disabled]="form.invalid"
            loadingText="Abriendo..."
            iconStart="add-outline"
          >
            Abrir cosecha
          </app-button-primary>
        </form>
      }
    </ion-content>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      max-width: 520px;
      margin: 0 auto;
      padding: var(--spacing-lg) var(--screen-margin) var(--spacing-xl);
      font-family: var(--font-family-body);
    }
    .card {
      padding: 20px var(--spacing-md) var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .harvest {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }
    .harvest__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-sm);
    }
    .harvest__title {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .harvest__title p,
    .harvest__title h2 {
      margin: 0;
    }
    .eyebrow {
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }
    .harvest__title h2 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      letter-spacing: -0.01em;
      line-height: 1.25;
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    .harvest__meta {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .harvest__menu {
      margin: -8px -12px 0 0;
    }
    /* Datos en renglones nombre → cifra; con letra grande la cifra baja a otra línea
       en vez de partir una palabra. */
    .facts {
      margin: 0;
    }
    .fact {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 2px var(--spacing-md);
      padding: 8px 0;
    }
    .fact + .fact {
      border-top: 1px solid var(--color-separator);
    }
    .fact dt {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .fact dd {
      margin: 0 0 0 auto;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .go-btn {
      --border-radius: var(--radius-full);
      height: 52px;
      min-height: 52px;
      margin: 0;
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
    }
    .notice {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      margin: 0;
      padding: 12px var(--spacing-md);
      border-radius: var(--radius-md);
      background: var(--color-primary-soft);
      font-size: var(--font-size-sm);
      line-height: 1.45;
      color: var(--color-text);
    }
    .notice ion-icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--color-primary-ink);
    }
    .close-btn {
      --border-radius: var(--radius-full);
      height: 48px;
      min-height: 48px;
      margin: 0;
      font-size: var(--font-size-md);
    }
    .hint {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      text-align: center;
    }
    .sk {
      --background: rgba(29, 33, 27, 0.07);
      --background-rgb: 29, 33, 27;
      margin: 0;
      border-radius: var(--radius-sm);
    }
    .sk--title { width: 65%; height: 26px; }
    .sk--line { width: 45%; height: 14px; }
    .sk--block { width: 100%; height: 120px; border-radius: var(--radius-md); }
  `],
})
export class CreatePage {
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly dashboard = inject(DashboardFacade);
  protected readonly network = inject(NetworkService);
  private readonly router = inject(Router);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly name = signal('');
  readonly pricePerKilogram = signal<number | null>(null);
  /** Propio del formulario: `harvestFacade.isLoading` también se enciende al leer, y mostraría el esqueleto. */
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** Esqueleto solo en la primera carga; al volver se queda lo que ya se ve. */
  protected readonly loaded = signal(false);

  protected readonly activePickers = computed(
    () => this.harvestFacade.activeHarvestPickers().filter((picker) => picker.status === 'active').length,
  );

  constructor() {
    addIcons({
      addOutline,
      alertCircleOutline,
      arrowForward,
      closeCircleOutline,
      createOutline,
      ellipsisVertical,
      informationCircleOutline,
      trashOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.harvestFacade.loadActiveHarvest().finally(() => this.loaded.set(true));
  }

  async onOpenHarvest(): Promise<void> {
    this.errorMessage.set(null);
    const pricePerKilogram = this.pricePerKilogram();
    if (pricePerKilogram === null || pricePerKilogram <= 0) {
      this.errorMessage.set('El precio por kilo debe ser mayor que 0.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.harvestFacade.openHarvest(this.name().trim(), pricePerKilogram);
      this.name.set('');
      this.pricePerKilogram.set(null);
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, 'No se pudo abrir la cosecha. Intenta de nuevo.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goToHarvest(): void {
    this.router.navigate(['/harvest/crews']);
  }

  /** Sin kilos pesados no hay nada que pagar ni vender: se avisa en lugar de abrir el cierre. */
  goToCloseHarvest(): void {
    if (this.dashboard.totalKilograms() > 0) {
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
        { text: 'Ir a pesar', role: 'confirm', handler: () => this.goToHarvest() },
      ],
    });
    await alert.present();
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
        // Texto y no número: "1.200" (con punto, como se escribe aquí) es mil doscientos, no 1,2.
        { name: 'price', type: 'text', placeholder: 'Precio por kilo', value: String(harvest.pricePerKilogram), attributes: { inputmode: 'numeric' } },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data: { name: string; price: string }) => {
            const name = data.name?.trim();
            const price = parseInteger(data.price);
            if (!name || !(price! > 0)) return false; // mantiene el diálogo abierto
            void this.saveHarvest(name, price!);
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
