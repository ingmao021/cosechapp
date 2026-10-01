import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { addIcons } from 'ionicons';
import { addOutline, cashOutline, cloudUploadOutline, restaurantOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { WeighingFacade } from '../../weighing/services/weighing.facade';
import { PaymentFacade } from '../../payment/services/payment.facade';
import { PaymentPreviewResponse } from '../../payment/services/payment.service';
import { NetworkService } from '../../network/services/network.service';
import { SyncStatusComponent } from '@shared/components';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { apiErrorMessage, formatCurrency, formatKilos } from '../../shared/utils';

/**
 * Detalle del recolector en la cosecha (Design System §1.5): acumulados de hoy, la
 * semana y el ciclo; saldo por pagar; pesadas de hoy; "Pagar ahora" con confirmación
 * del monto (y alimentación) y el historial de pagos.
 */
@Component({
  selector: 'app-picker-detail',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    SyncStatusComponent,
    KilosPipe,
    CurrencyPipe,
    DateFormatPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="backUrl()" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">{{ picker()?.displayName ?? 'Recolector' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page">
        <app-sync-status></app-sync-status>

        @if (!picker()) {
          @if (harvestFacade.isLoading()) {
            <div class="loading-center"><ion-spinner name="crescent"></ion-spinner></div>
          } @else {
            <p class="empty">No encontramos este recolector en la cosecha activa.</p>
          }
        } @else {
          @if (picker()!.alias) {
            <p class="form-page__intro">{{ picker()!.firstName }} {{ picker()!.lastName }}</p>
          }

          <section class="card totals" aria-label="Kilos recogidos">
            <div class="total">
              <span class="total__value">{{ picker()!.todayKilograms | kilos }}</span>
              <span class="total__label">Hoy</span>
            </div>
            <div class="total">
              <span class="total__value">{{ picker()!.weekKilograms | kilos }}</span>
              <span class="total__label">Esta semana</span>
            </div>
            <div class="total">
              <span class="total__value">{{ picker()!.totalKilograms | kilos }}</span>
              <span class="total__label">Toda la cosecha</span>
            </div>
          </section>

          <section class="card balance">
            <div>
              <p class="balance__label">Saldo por pagar</p>
              <p class="balance__value">{{ picker()!.balanceDue | currency }}</p>
              <p class="balance__meta">Pagado: {{ picker()!.totalPaid | currency }}
                @if (picker()!.totalMealDeductions > 0) {
                  · Alimentación descontada: {{ picker()!.totalMealDeductions | currency }}
                }
              </p>
            </div>
          </section>

          <div class="actions">
            <ion-button expand="block" color="primary" [disabled]="picker()!.status !== 'active'" (click)="addWeighing()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Registrar pesada
            </ion-button>
            <ion-button
              expand="block"
              fill="outline"
              color="primary"
              [disabled]="!canPay()"
              (click)="payNow()"
            >
              <ion-icon name="cash-outline" slot="start"></ion-icon>
              Pagar ahora
            </ion-button>
            @if (!network.isOnline()) {
              <p class="hint">Necesitas conexión para pagar.</p>
            } @else if (picker()!.balanceDue === 0) {
              <p class="hint">No tiene saldo pendiente.</p>
            }
          </div>

          <section>
            <h2 class="text-level-2">Pesadas de hoy</h2>
            @if (weighingFacade.todayWeighings().length === 0) {
              <p class="empty">Todavía no hay pesadas hoy.</p>
            } @else {
              <ul class="rows">
                @for (weighing of weighingFacade.todayWeighings(); track weighing.id) {
                  <li class="row">
                    <span class="row__main">{{ weighing.kilograms | kilos }}</span>
                    <span class="row__meta">
                      @if (weighing.pending) {
                        <ion-icon name="cloud-upload-outline" aria-hidden="true"></ion-icon> Por enviar ·
                      }
                      {{ weighing.dateTime | dateFormat: 'time' }}
                    </span>
                  </li>
                }
              </ul>
            }
          </section>

          <section>
            <h2 class="text-level-2">Pagos</h2>
            @if (paymentFacade.payments().length === 0) {
              <p class="empty">Aún no se le ha pagado en esta cosecha.</p>
            } @else {
              <ul class="rows">
                @for (payment of paymentFacade.payments(); track payment.id) {
                  <li class="row">
                    <span class="row__main">{{ payment.amount | currency }}</span>
                    <span class="row__meta">
                      @if (payment.includesMeals) {
                        <ion-icon name="restaurant-outline" aria-hidden="true"></ion-icon>
                        −{{ payment.mealDeduction | currency }} ·
                      }
                      {{ payment.dateTime | dateFormat: 'short' }}
                    </span>
                  </li>
                }
              </ul>
            }
          </section>
        }
      </div>
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
    }
    .card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      padding: var(--spacing-md);
    }
    .totals {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-sm);
      text-align: center;
    }
    .total {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .total__value {
      font-family: var(--font-family-display);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }
    .total__label,
    .balance__label,
    .balance__meta,
    .hint,
    .row__meta {
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .balance p {
      margin: 0;
    }
    .balance__value {
      font-family: var(--font-family-display);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .hint {
      margin: 0;
      text-align: center;
    }
    h2 {
      margin: var(--spacing-sm) 0;
    }
    .rows {
      list-style: none;
      margin: 0;
      padding: 0;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: var(--list-row-height);
      padding: 0 var(--list-row-padding-h);
      border-bottom: 1px solid var(--color-border);
      font-family: var(--font-family-body);
    }
    .row:last-child {
      border-bottom: none;
    }
    .row__main {
      font-weight: var(--font-weight-bold);
    }
    .row__meta {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    .row__meta ion-icon {
      font-size: 16px;
    }
    .empty {
      margin: 0;
      font-family: var(--font-family-body);
      color: var(--color-text-muted);
    }
    .loading-center {
      display: flex;
      justify-content: center;
      padding: var(--spacing-xl);
    }
  `],
})
export class PickerDetailPage {
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly weighingFacade = inject(WeighingFacade);
  protected readonly paymentFacade = inject(PaymentFacade);
  protected readonly network = inject(NetworkService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  private readonly pickerId = this.route.snapshot.paramMap.get('pickerId') ?? '';

  readonly picker = computed(() =>
    this.harvestFacade.activeHarvestPickers().find((picker) => picker.id === this.pickerId) ?? null,
  );

  readonly backUrl = computed(() => {
    const crewId = this.picker()?.crewId;
    return crewId ? `/harvest/crews/${crewId}` : '/harvest/crews';
  });

  readonly canPay = computed(() => {
    const picker = this.picker();
    return !!picker && picker.status === 'active' && picker.balanceDue > 0 && this.network.isOnline();
  });

  constructor() {
    addIcons({ addOutline, cashOutline, cloudUploadOutline, restaurantOutline });
    if (!this.harvestFacade.hasActiveHarvest()) {
      this.harvestFacade.loadActiveHarvest();
    }
  }

  /** Al volver a la pantalla (ej. después de registrar una pesada) refresca los datos. */
  ionViewWillEnter(): void {
    const harvest = this.harvestFacade.activeHarvest();
    if (harvest) void this.harvestFacade.loadPickers(harvest.id);
    void this.weighingFacade.loadWeighingsForPicker(this.pickerId);
    void this.paymentFacade.loadPaymentsForPicker(this.pickerId);
  }

  addWeighing(): void {
    this.router.navigate(['/harvest/pickers', this.pickerId, 'weighing', 'new']);
  }

  /** Pagar ahora: alimentación (con/sin y cuánto) → desglose con el neto → confirmar. */
  async payNow(): Promise<void> {
    const harvest = this.harvestFacade.activeHarvest();
    const picker = this.picker();
    if (!harvest || !picker) return;

    const mealDeduction = await this.askMeals();
    if (mealDeduction === undefined) return;

    let preview: PaymentPreviewResponse;
    try {
      preview = await this.paymentFacade.preview(picker.id, harvest.id, mealDeduction);
    } catch (err: unknown) {
      await this.toast(apiErrorMessage(err, 'No se pudo calcular el pago. Intenta de nuevo.'), 'danger');
      return;
    }

    if (!(await this.confirmPayment(picker.displayName, preview))) return;

    try {
      const result = await this.paymentFacade.payNow(picker.id, harvest.id, mealDeduction);
      await this.toast(`Pago registrado: ${formatCurrency(result.payment.amount)} a ${picker.displayName}.`, 'success');
      await this.harvestFacade.loadPickers(harvest.id);
    } catch (err: unknown) {
      await this.toast(apiErrorMessage(err, 'No se pudo registrar el pago. Intenta de nuevo.'), 'danger');
    }
  }

  /** null = sin alimentación; número = valor a descontar; undefined = canceló. */
  private async askMeals(): Promise<number | null | undefined> {
    const choice = await this.alertController.create({
      header: '¿Le diste alimentación?',
      inputs: [
        { type: 'radio', label: 'Sin alimentación', value: 'no', checked: true },
        { type: 'radio', label: 'Con alimentación (descontar)', value: 'yes' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Continuar', role: 'confirm' },
      ],
    });
    await choice.present();
    const picked = await choice.onDidDismiss();
    if (picked.role !== 'confirm') return undefined;
    if (picked.data?.values !== 'yes') return null;

    const amount = await this.alertController.create({
      header: 'Valor de la alimentación',
      message: 'Cuánto le descuentas por la comida en este pago.',
      inputs: [{ name: 'value', type: 'number', placeholder: 'Ej: 10000', min: 1, attributes: { inputmode: 'numeric' } }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Continuar',
          role: 'confirm',
          handler: (data: { value: string }) => Number(data.value) > 0, // sin valor, el diálogo sigue abierto
        },
      ],
    });
    await amount.present();
    const entered = await amount.onDidDismiss();
    return entered.role === 'confirm' ? Math.round(Number(entered.data?.values?.value)) : undefined;
  }

  private async confirmPayment(name: string, preview: PaymentPreviewResponse): Promise<boolean> {
    const lines = [
      `${formatKilos(preview.totalKilograms)} en la cosecha: ${formatCurrency(preview.gross)}`,
      preview.alreadyPaid > 0 ? `Ya pagado: −${formatCurrency(preview.alreadyPaid)}` : null,
      preview.previousMealDeductions > 0 ? `Alimentación anterior: −${formatCurrency(preview.previousMealDeductions)}` : null,
      preview.mealDeduction > 0 ? `Alimentación de este pago: −${formatCurrency(preview.mealDeduction)}` : null,
    ].filter((line): line is string => line !== null);

    const alert = await this.alertController.create({
      header: `Pagar a ${name}`,
      subHeader: `A pagar: ${formatCurrency(preview.net)}`,
      message: lines.join(' · '),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: `Pagar ${formatCurrency(preview.net)}`, role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}
