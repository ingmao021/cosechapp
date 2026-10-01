import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  addOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  cashOutline,
  warningOutline,
} from 'ionicons/icons';
import { AppInputComponent, AppButtonPrimaryComponent } from '@shared/components';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { HarvestFacade } from '../services/harvest.facade';
import { HarvestService, HarvestResponse } from '../services/harvest.service';
import { SaleAndCostsFacade } from '../../sale-and-costs/services/sale-and-costs.facade';
import { NetworkService } from '../../network/services/network.service';
import { apiErrorMessage } from '../../shared/utils';

type Step = 'close' | 'sale' | 'costs';

const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/**
 * Cierre de cosecha (Design System §1.8), en el orden que exige el negocio:
 * 1. Cerrar: ya no se registran pesadas ni pagos (avisa si quedan saldos pendientes).
 * 2. Venta: kilos secos vendidos y precio → ganancia bruta.
 * 3. Costos de producción → ganancia de la cosecha.
 * Con /harvest/close/:harvestId se retoma en el paso pendiente (ej. desde el historial).
 */
@Component({
  selector: 'app-harvest-close',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    AppInputComponent,
    AppButtonPrimaryComponent,
    CurrencyPipe,
    KilosPipe,
    DateFormatPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="step() === 'close' ? '/home' : '/history'" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">Cerrar cosecha</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!harvest()) {
        <div class="loading-center">
          @if (loading()) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            <p class="form-page__intro">No hay una cosecha para cerrar.</p>
          }
        </div>
      } @else {
        <div class="form-page">
          <ol class="steps" aria-label="Pasos del cierre">
            <li [class.current]="step() === 'close'" [class.done]="step() !== 'close'">1. Cerrar</li>
            <li [class.current]="step() === 'sale'" [class.done]="step() === 'costs'">2. Venta</li>
            <li [class.current]="step() === 'costs'">3. Costos</li>
          </ol>

          @if (!network.isOnline()) {
            <p class="form-error" role="alert">
              <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
              <span>Necesitas conexión para cerrar la cosecha y registrar la venta.</span>
            </p>
          }

          @if (errorMessage()) {
            <p class="form-error" role="alert">
              <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
              <span>{{ errorMessage() }}</span>
            </p>
          }

          @switch (step()) {
            @case ('close') {
              <section class="card">
                <h2 class="text-level-2">{{ harvest()!.name }}</h2>
                <dl class="summary">
                  <div><dt>Recolectores</dt><dd>{{ activePickers().length }}</dd></div>
                  <div><dt>Café cereza recogido</dt><dd>{{ totalCherryKilograms() | kilos }}</dd></div>
                  <div><dt>Pagado a recolectores</dt><dd>{{ totalPaid() | currency }}</dd></div>
                </dl>
              </section>

              @if (pendingBalance() > 0) {
                <p class="warning" role="status">
                  <ion-icon name="warning-outline" aria-hidden="true"></ion-icon>
                  <span>
                    {{ pickersWithBalance() }} {{ pickersWithBalance() === 1 ? 'recolector tiene' : 'recolectores tienen' }}
                    saldo pendiente por {{ pendingBalance() | currency }}. Después de cerrar ya no podrás pagarles desde la app.
                  </span>
                </p>
              }

              <p class="form-page__intro">
                Al cerrar ya no se pueden registrar pesadas ni pagos. Luego registras la venta y los costos.
              </p>

              <app-button-primary
                color="danger"
                iconStart="lock-closed-outline"
                [loading]="busy()"
                loadingText="Cerrando..."
                [disabled]="!network.isOnline()"
                (buttonClick)="closeHarvest()"
              >
                Cerrar cosecha
              </app-button-primary>
            }

            @case ('sale') {
              <form class="form-page__fields" (ngSubmit)="recordSale()" #saleForm="ngForm" novalidate>
                <p class="form-page__intro">
                  Recogiste {{ totalCherryKilograms() | kilos }} de café cereza: se esperan unos
                  {{ projectedDryKilograms() | kilos }} secos.
                </p>
                <app-input
                  label="Kilos secos vendidos"
                  type="number"
                  name="dryKilograms"
                  [(ngModel)]="dryKilograms"
                  required
                  inputmode="decimal"
                  placeholder="Ej: 1250"
                  errorMessage="Escribe los kilos secos que vendiste."
                ></app-input>
                <app-input
                  label="Precio por kilo seco (COP)"
                  type="number"
                  name="salePrice"
                  [(ngModel)]="salePrice"
                  required
                  inputmode="numeric"
                  placeholder="Ej: 18000"
                  errorMessage="Escribe el precio al que vendiste cada kilo."
                ></app-input>
                <app-input
                  label="Fecha de la venta"
                  name="saleDate"
                  [(ngModel)]="saleDate"
                  required
                  placeholder="AAAA-MM-DD"
                  helperText="Formato año-mes-día. Por defecto, hoy."
                  errorMessage="Escribe la fecha de la venta."
                ></app-input>
                @if (saleTotal() > 0) {
                  <p class="form-page__intro">Total de la venta: <strong>{{ saleTotal() | currency }}</strong></p>
                }
                <app-button-primary
                  type="submit"
                  iconStart="cash-outline"
                  [loading]="busy()"
                  loadingText="Guardando..."
                  [disabled]="saleForm.invalid || !network.isOnline()"
                >
                  Registrar venta
                </app-button-primary>
              </form>
            }

            @case ('costs') {
              <section class="card">
                <dl class="summary">
                  <div><dt>Venta</dt><dd>{{ profit()?.grossRevenue ?? 0 | currency }}</dd></div>
                  <div><dt>Pagos a recolectores</dt><dd>− {{ profit()?.totalPickerPayments ?? 0 | currency }}</dd></div>
                  <div class="strong"><dt>Ganancia bruta</dt><dd>{{ profit()?.grossProfit ?? 0 | currency }}</dd></div>
                  <div><dt>Costos de producción</dt><dd>− {{ profit()?.totalProductionCosts ?? 0 | currency }}</dd></div>
                  <div class="total">
                    <dt>Ganancia de la cosecha</dt>
                    <dd [class.loss]="(profit()?.actualProfit ?? 0) < 0">{{ profit()?.actualProfit ?? 0 | currency }}</dd>
                  </div>
                </dl>
              </section>

              <form class="form-page__fields" (ngSubmit)="addCost()" #costForm="ngForm" novalidate>
                <h2 class="text-level-2">Agregar costo de producción</h2>
                <app-input
                  label="Descripción"
                  name="costDescription"
                  [(ngModel)]="costDescription"
                  required
                  maxlength="200"
                  placeholder="Ej: Abono, transporte, beneficio"
                  errorMessage="Escribe en qué gastaste."
                ></app-input>
                <app-input
                  label="Valor (COP)"
                  type="number"
                  name="costAmount"
                  [(ngModel)]="costAmount"
                  required
                  inputmode="numeric"
                  placeholder="Ej: 500000"
                  errorMessage="Escribe cuánto gastaste."
                ></app-input>
                <app-button-primary
                  type="submit"
                  fill="outline"
                  iconStart="add-outline"
                  [loading]="busy()"
                  loadingText="Guardando..."
                  [disabled]="costForm.invalid || !network.isOnline()"
                >
                  Agregar costo
                </app-button-primary>
              </form>

              @if (saleAndCostsFacade.costs().length > 0) {
                <ul class="rows">
                  @for (cost of saleAndCostsFacade.costs(); track cost.id) {
                    <li class="row">
                      <span>{{ cost.description }}<small>{{ cost.date | dateFormat: 'date' }}</small></span>
                      <strong>{{ cost.amount | currency }}</strong>
                    </li>
                  }
                </ul>
              }

              <ion-button expand="block" color="primary" (click)="finish()">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                Terminar
              </ion-button>
            }
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .steps {
      display: flex;
      gap: var(--spacing-sm);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .steps li {
      flex: 1;
      padding: var(--spacing-xs) 0;
      border-bottom: 3px solid var(--color-border);
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      text-align: center;
    }
    .steps li.done {
      border-color: var(--color-primary-muted);
    }
    .steps li.current {
      border-color: var(--color-primary);
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }
    .card {
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .card h2 {
      margin: 0 0 var(--spacing-sm);
    }
    .summary {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      font-family: var(--font-family-body);
    }
    .summary div {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-md);
    }
    .summary dt {
      color: var(--color-text-muted);
    }
    .summary dd {
      margin: 0;
      font-weight: var(--font-weight-bold);
    }
    .summary .strong dt {
      color: var(--color-text);
    }
    .summary .total {
      padding-top: var(--spacing-sm);
      border-top: 2px solid var(--color-primary);
      font-size: var(--font-size-lg);
    }
    .summary .total dt {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }
    .summary .total dd {
      color: var(--color-primary);
    }
    .summary dd.loss {
      color: var(--color-accent-alert);
    }
    .warning {
      display: flex;
      gap: var(--spacing-sm);
      margin: 0;
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-sm);
      background: rgba(183, 121, 31, 0.12);
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
    }
    .warning ion-icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--ion-color-warning);
    }
    h2 {
      margin: 0;
    }
    .rows {
      list-style: none;
      margin: 0;
      padding: 0;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      min-height: var(--list-row-height);
      padding: var(--spacing-sm) var(--list-row-padding-h);
      border-bottom: 1px solid var(--color-border);
      font-family: var(--font-family-body);
    }
    .row:last-child {
      border-bottom: none;
    }
    .row small {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .loading-center {
      display: flex;
      justify-content: center;
      padding: var(--spacing-xl);
    }
  `],
})
export class HarvestClosePage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertController = inject(AlertController);
  private readonly harvestService = inject(HarvestService);
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly saleAndCostsFacade = inject(SaleAndCostsFacade);
  protected readonly network = inject(NetworkService);

  readonly harvest = signal<HarvestResponse | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly dryKilograms = signal<number | null>(null);
  readonly salePrice = signal<number | null>(null);
  readonly saleDate = signal(today());
  readonly costDescription = signal('');
  readonly costAmount = signal<number | null>(null);

  readonly profit = this.saleAndCostsFacade.profit;

  readonly step = computed<Step>(() => {
    if (this.harvest()?.status === 'active') return 'close';
    return this.saleAndCostsFacade.hasSale() ? 'costs' : 'sale';
  });

  readonly activePickers = computed(() => this.harvestFacade.activeHarvestPickers().filter((p) => p.status === 'active'));
  readonly totalPaid = computed(() => this.harvestFacade.activeHarvestPickers().reduce((sum, p) => sum + p.totalPaid, 0));
  readonly pendingBalance = computed(() => this.activePickers().reduce((sum, p) => sum + p.balanceDue, 0));
  readonly pickersWithBalance = computed(() => this.activePickers().filter((p) => p.balanceDue > 0).length);
  readonly totalCherryKilograms = computed(() => {
    const fromPickers = this.harvestFacade.activeHarvestPickers().reduce((sum, p) => sum + p.totalKilograms, 0);
    // Ya cerrada, los recolectores salen de la cosecha activa: se usa lo que calculó el backend (secos × 5).
    return this.harvest()?.status === 'active' ? fromPickers : (this.profit()?.projectedDryKilograms ?? 0) * 5;
  });
  readonly projectedDryKilograms = computed(() => this.totalCherryKilograms() / 5);
  readonly saleTotal = computed(() => (this.dryKilograms() ?? 0) * (this.salePrice() ?? 0));

  constructor() {
    addIcons({ alertCircleOutline, addOutline, checkmarkCircleOutline, lockClosedOutline, cashOutline, warningOutline });
    void this.load();
  }

  async closeHarvest(): Promise<void> {
    const harvest = this.harvest();
    if (!harvest || !(await this.confirmClose(harvest.name))) return;

    await this.runStep('No se pudo cerrar la cosecha.', async () => {
      const closed = await this.harvestFacade.closeHarvest(harvest.id);
      this.harvest.set(closed);
      await this.saleAndCostsFacade.loadHarvestProfit(closed.id);
      // Si sale de la pantalla, puede retomar desde el historial en el paso de la venta.
      await this.router.navigate(['/harvest/close', closed.id], { replaceUrl: true });
    });
  }

  async recordSale(): Promise<void> {
    const harvest = this.harvest();
    const dryKilograms = this.dryKilograms();
    const salePrice = this.salePrice();
    if (!harvest || !(dryKilograms! > 0) || !(salePrice! > 0)) {
      this.errorMessage.set('Los kilos y el precio deben ser mayores que cero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.saleDate())) {
      this.errorMessage.set('Escribe la fecha como año-mes-día, por ejemplo 2026-10-01.');
      return;
    }
    await this.runStep('No se pudo registrar la venta.', () =>
      this.saleAndCostsFacade.recordSale({
        harvestId: harvest.id,
        actualDryKilograms: dryKilograms!,
        salePrice: salePrice!,
        date: this.saleDate(),
      }),
    );
  }

  async addCost(): Promise<void> {
    const harvest = this.harvest();
    const amount = this.costAmount();
    if (!harvest || !this.costDescription().trim() || !(amount! > 0)) {
      this.errorMessage.set('Escribe la descripción y un valor mayor que cero.');
      return;
    }
    await this.runStep('No se pudo agregar el costo.', async () => {
      await this.saleAndCostsFacade.addProductionCost({
        harvestId: harvest.id,
        description: this.costDescription().trim(),
        amount: amount!,
        date: today(),
      });
      this.costDescription.set('');
      this.costAmount.set(null);
    });
  }

  finish(): void {
    const harvest = this.harvest();
    this.router.navigate(harvest ? ['/harvest/history', harvest.id] : ['/history'], { replaceUrl: true });
  }

  private async load(): Promise<void> {
    const harvestId = this.route.snapshot.paramMap.get('harvestId');
    try {
      if (harvestId) {
        this.harvest.set(await firstValueFrom(this.harvestService.getHarvestById(harvestId)));
      } else {
        if (!this.harvestFacade.hasActiveHarvest()) await this.harvestFacade.loadActiveHarvest();
        this.harvest.set(this.harvestFacade.activeHarvest());
      }
      const harvest = this.harvest();
      if (harvest && harvest.status === 'closed') {
        await this.saleAndCostsFacade.loadHarvestProfit(harvest.id);
      } else {
        this.saleAndCostsFacade.clearState();
      }
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, 'No se pudo cargar la cosecha.'));
    } finally {
      this.loading.set(false);
    }
  }

  private async confirmClose(name: string): Promise<boolean> {
    const alert = await this.alertController.create({
      header: `¿Cerrar "${name}"?`,
      message: 'Ya no podrás registrar pesadas ni pagos en esta cosecha. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar cosecha', role: 'confirm', cssClass: 'alert-button-danger' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  private async runStep(fallback: string, action: () => Promise<unknown>): Promise<void> {
    this.errorMessage.set(null);
    this.busy.set(true);
    try {
      await action();
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, fallback));
    } finally {
      this.busy.set(false);
    }
  }
}
