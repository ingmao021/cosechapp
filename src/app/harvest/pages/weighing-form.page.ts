import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonIcon } from '@ionic/angular/ion-icon';
import { NavController } from '@ionic/angular/nav-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { addIcons } from 'ionicons';
import { alertCircleOutline, scaleOutline } from 'ionicons/icons';
import { AppInputComponent, AppButtonPrimaryComponent, SyncStatusComponent } from '@shared/components';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { HarvestFacade } from '../services/harvest.facade';
import { SyncFacade } from '../../sync/services/sync.facade';
import { apiErrorMessage, formatKilos } from '../../shared/utils';

/** Máximo razonable para una sola pesada (mismo límite que valida el backend). */
const MAX_KILOGRAMS = 1000;

/**
 * Registro de pesada (Design System §1.6): campo de kilos, fecha y hora automáticas
 * y confirmación visual al guardar. Funciona sin señal: la pesada queda en el teléfono
 * y se envía sola al volver la conexión.
 */
@Component({
  selector: 'app-weighing-form',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonIcon,
    AppInputComponent,
    AppButtonPrimaryComponent,
    SyncStatusComponent,
    KilosPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="pickerUrl" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">Registrar pesada</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form class="form-page" (ngSubmit)="onSave()" #form="ngForm" novalidate>
        <app-sync-status></app-sync-status>

        <p class="form-page__intro">
          Pesada de <strong>{{ pickerName() }}</strong>.
          @if (todayKilograms() !== null) {
            Hoy lleva {{ todayKilograms() | kilos }}.
          }
          La fecha y la hora se guardan solas.
        </p>

        <div class="form-page__fields">
          <app-input
            label="Kilos"
            type="number"
            name="kilograms"
            [(ngModel)]="kilograms"
            required
            inputmode="decimal"
            placeholder="Ej: 25.5"
            helperText="Kilos de café cereza de esta pesada."
            errorMessage="Escribe los kilos de la pesada."
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
          [loading]="isSaving()"
          [disabled]="form.invalid"
          loadingText="Guardando..."
          iconStart="scale-outline"
        >
          Guardar pesada
        </app-button-primary>
      </form>
    </ion-content>
  `,
  styles: [`
    app-sync-status:empty {
      display: none;
    }
  `],
})
export class WeighingFormPage {
  private readonly harvestFacade = inject(HarvestFacade);
  private readonly syncFacade = inject(SyncFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly navController = inject(NavController);
  private readonly toastController = inject(ToastController);

  private readonly pickerId = this.route.snapshot.paramMap.get('pickerId') ?? '';
  protected readonly pickerUrl = `/harvest/pickers/${this.pickerId}`;

  readonly kilograms = signal<number | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private readonly picker = computed(() => this.harvestFacade.pickerById(this.pickerId));
  readonly pickerName = computed(() => this.picker()?.displayName ?? 'el recolector');
  readonly todayKilograms = computed(() => this.picker()?.todayKilograms ?? null);

  constructor() {
    addIcons({ alertCircleOutline, scaleOutline });
    if (!this.harvestFacade.hasActiveHarvest()) {
      this.harvestFacade.loadActiveHarvest();
    }
  }

  async onSave(): Promise<void> {
    this.errorMessage.set(null);
    const kilograms = this.kilograms();
    if (kilograms === null || !(kilograms > 0)) {
      this.errorMessage.set('Los kilos deben ser mayores que cero.');
      return;
    }
    if (kilograms > MAX_KILOGRAMS) {
      this.errorMessage.set(`Revisa el valor: una pesada no puede pasar de ${formatKilos(MAX_KILOGRAMS)}.`);
      return;
    }

    this.isSaving.set(true);
    try {
      const rounded = Math.round(kilograms * 1000) / 1000;
      const outcome = await this.syncFacade.recordWeighing({ harvestPickerId: this.pickerId, kilograms: rounded });
      const message =
        outcome === 'sent'
          ? `Pesada guardada: ${formatKilos(rounded)}.`
          : `Pesada guardada en el teléfono: ${formatKilos(rounded)}. Se enviará al volver la señal.`;
      const toast = await this.toastController.create({ message, color: 'success', duration: 2500, position: 'bottom' });
      await toast.present();
      this.navController.navigateBack(this.pickerUrl);
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, 'No se pudo guardar la pesada. Intenta de nuevo.'));
    } finally {
      this.isSaving.set(false);
    }
  }
}
