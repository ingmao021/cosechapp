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
import { IonModal } from '@ionic/angular/ion-modal';
import { IonDatetime } from '@ionic/angular/ion-datetime';
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
import { AppInputComponent, AppButtonPrimaryComponent, EmptyStateComponent, ListSkeletonComponent } from '@shared/components';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { HarvestFacade } from '../services/harvest.facade';
import { HarvestService, HarvestResponse, ClosePreviewResponse } from '../services/harvest.service';
import { ToastController } from '@ionic/angular/toast-controller';
import { formatCurrency, hapticSuccess } from '../../shared/utils';
import { SaleAndCostsFacade } from '../../sale-and-costs/services/sale-and-costs.facade';
import { NetworkService } from '../../network/services/network.service';
import { apiErrorMessage } from '../../shared/utils';

type Step = 'close' | 'sale' | 'costs';

const DAY_MS = 24 * 60 * 60 * 1000;
const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;
/** Día en Colombia ("AAAA-MM-DD"), sin importar la zona horaria del teléfono; daysAgo 1 = ayer. */
const colombiaDay = (daysAgo = 0) => new Date(Date.now() + COLOMBIA_OFFSET_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);

const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/**
 * Cierre de cosecha (Design System §1.8), en el orden que exige el negocio:
 * 1. Cerrar: se le paga a todos lo pendiente (menos la comida por día, si la hubo) y ya no
 *    se registran pesadas ni pagos. "Pagar ahora" queda solo para quien se va antes.
 * 2. Venta: kilos secos vendidos y precio → ganancia bruta.
 * 3. Costos de producción → ganancia de la cosecha.
 * Con /harvest/close/:harvestId se retoma en el paso pendiente (ej. desde el historial).
 */
@Component({
  selector: 'app-harvest-close',
  standalone: true,
  imports: [
    EmptyStateComponent,
    ListSkeletonComponent,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonModal,
    IonDatetime,
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
        <div class="form-page">
          @if (loading()) {
            <app-list-skeleton [rows]="3" [avatar]="false"></app-list-skeleton>
          } @else {
            <app-empty-state icon="alert-circle-outline" title="No hay una cosecha para cerrar"></app-empty-state>
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

              <!-- Alimentación: se le descuenta a todos por cada día que pesaron -->
              <section class="card">
                <h3 class="text-level-3 card__title">¿Les diste alimentación?</h3>
                <p class="form-page__intro">Si la hubo, se le descuenta a todos los trabajadores por cada día que pesaron.</p>
                <div class="choice" role="radiogroup" aria-label="Alimentación">
                  <button type="button" role="radio" class="choice__option" [class.selected]="mealsChoice() === 'no'"
                    [attr.aria-checked]="mealsChoice() === 'no'" (click)="chooseMeals('no')">Sin alimentación</button>
                  <button type="button" role="radio" class="choice__option" [class.selected]="mealsChoice() === 'yes'"
                    [attr.aria-checked]="mealsChoice() === 'yes'" (click)="chooseMeals('yes')">Con alimentación</button>
                </div>
                @if (mealsChoice() === 'yes') {
                  <app-input
                    label="¿Cuánto cobras de comida por día?"
                    type="number"
                    inputmode="numeric"
                    name="mealPerDay"
                    placeholder="Ej: 10000"
                    [ngModel]="mealPerDay()"
                    (ngModelChange)="onMealPerDay($event)"
                  ></app-input>
                }
              </section>

              <!-- Lo que se le paga a cada uno al cerrar -->
              @if (closePreview(); as preview) {
                <section class="card" aria-live="polite">
                  <h3 class="text-level-3 card__title">Pago al cerrar</h3>
                  @if (preview.settledPickers === 0) {
                    <p class="form-page__intro">Todos los trabajadores ya están pagos.</p>
                  } @else {
                    <p class="settle-total">
                      Se le paga a {{ preview.settledPickers }} {{ preview.settledPickers === 1 ? 'trabajador' : 'trabajadores' }}:
                      <strong>{{ preview.totalNet | currency }}</strong>
                    </p>
                    @if (preview.totalMeals > 0) {
                      <p class="form-page__intro">Comida descontada: −{{ preview.totalMeals | currency }}</p>
                    }
                    <details class="settle-details">
                      <summary>Ver por trabajador</summary>
                      <ul class="settle-list">
                        @for (line of preview.pickers; track line.harvestPickerId) {
                          <li>
                            <span class="settle-list__name">{{ line.displayName }}</span>
                            <span class="settle-list__meta">
                              {{ line.totalKilograms | kilos }}
                              @if (line.mealDays) { · comida {{ line.mealDays }} {{ line.mealDays === 1 ? 'día' : 'días' }} −{{ line.mealDeduction | currency }} }
                            </span>
                            <strong>{{ line.net | currency }}</strong>
                          </li>
                        }
                      </ul>
                    </details>
                  }
                </section>
              }

              <p class="form-page__intro">
                Al cerrar se registra el pago de todos y ya no se pueden registrar pesadas ni pagos. Luego registras la venta y los costos.
              </p>

              <app-button-primary
                color="danger"
                iconStart="lock-closed-outline"
                [loading]="busy()"
                loadingText="Cerrando..."
                [disabled]="!network.isOnline() || !canClose()"
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
                <!-- Fecha con un toque: sin escribir y sin venir ya marcada -->
                <div class="sale-date">
                  <span class="sale-date__label" id="sale-date-label">Fecha de la venta</span>
                  <div class="choice choice--three" role="radiogroup" aria-labelledby="sale-date-label">
                    <button type="button" role="radio" class="choice__option" [class.selected]="saleDateChoice() === 'today'"
                      [attr.aria-checked]="saleDateChoice() === 'today'" (click)="pickSaleDay('today')">Hoy</button>
                    <button type="button" role="radio" class="choice__option" [class.selected]="saleDateChoice() === 'yesterday'"
                      [attr.aria-checked]="saleDateChoice() === 'yesterday'" (click)="pickSaleDay('yesterday')">Ayer</button>
                    <button type="button" role="radio" class="choice__option" [class.selected]="saleDateChoice() === 'other'"
                      [attr.aria-checked]="saleDateChoice() === 'other'" (click)="calendarOpen.set(true)">Otro día</button>
                  </div>
                  @if (saleDateLabel()) {
                    <p class="sale-date__chosen" aria-live="polite">✓ {{ saleDateLabel() }}</p>
                  }
                </div>
                <ion-modal class="sheet-modal" [isOpen]="calendarOpen()" [initialBreakpoint]="0.75" [breakpoints]="[0, 0.75]" [handle]="true" (didDismiss)="calendarOpen.set(false)">
                  <ng-template>
                    <div class="calendar">
                      <h3 class="text-level-2">¿Qué día vendiste?</h3>
                      <ion-datetime
                        presentation="date"
                        locale="es-CO"
                        [firstDayOfWeek]="1"
                        [max]="maxSaleDate"
                        [value]="saleDateChoice() === 'other' ? saleDate() : null"
                        [showDefaultButtons]="true"
                        doneText="Listo"
                        cancelText="Cancelar"
                        (ionChange)="onCalendarDate($event.detail.value)"
                        (ionCancel)="calendarOpen.set(false)"
                      ></ion-datetime>
                    </div>
                  </ng-template>
                </ion-modal>
                @if (saleTotal() > 0) {
                  <p class="form-page__intro">Total de la venta: <strong>{{ saleTotal() | currency }}</strong></p>
                }
                <app-button-primary
                  type="submit"
                  iconStart="cash-outline"
                  [loading]="busy()"
                  loadingText="Guardando..."
                  [disabled]="saleForm.invalid || !saleDate() || !network.isOnline()"
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
      transition: border-color var(--dur-fast) ease, color var(--dur-fast) ease;
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
      border-radius: var(--radius-lg);
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
      font-variant-numeric: tabular-nums;
      text-align: right;
      overflow-wrap: anywhere;
    }
    .summary .strong dt {
      color: var(--color-text);
    }
    .summary .total {
      padding-top: var(--spacing-sm);
      border-top: 1px solid rgba(43, 36, 32, 0.08);
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
    .card__title {
      margin: 0 0 var(--spacing-xs);
    }
    .choice {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
      margin: var(--spacing-sm) 0;
    }
    .choice__option {
      min-height: var(--touch-target-min);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font: inherit;
      font-weight: var(--font-weight-bold);
      transition:
        transform var(--dur-press) var(--ease-out),
        background-color var(--dur-fast) ease,
        border-color var(--dur-fast) ease,
        color var(--dur-fast) ease;
    }
    .choice__option:active {
      transform: scale(0.97);
    }
    @media (prefers-reduced-motion: reduce) {
      .choice__option:active {
        transform: none;
      }
    }
    .choice--three {
      grid-template-columns: repeat(3, 1fr);
    }
    .sale-date__label {
      font-weight: var(--font-weight-bold);
    }
    .sale-date__chosen {
      margin: 0;
      color: var(--color-primary);
      font-weight: var(--font-weight-bold);
    }
    .calendar {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-md) calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
    }
    .calendar h3 {
      margin: 0 0 var(--spacing-sm);
      font-family: var(--font-family-display);
    }
    .choice__option.selected {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
    }
    .settle-total {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-md);
    }
    .settle-details summary {
      cursor: pointer;
      color: var(--color-primary);
      font-weight: var(--font-weight-bold);
    }
    .settle-list {
      list-style: none;
      margin: var(--spacing-sm) 0 0;
      padding: 0;
    }
    .settle-list li {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: var(--spacing-sm);
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid rgba(43, 36, 32, 0.08);
    }
    .settle-list__name {
      font-weight: var(--font-weight-bold);
    }
    .settle-list__meta {
      grid-column: 1;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .settle-list strong {
      font-variant-numeric: tabular-nums;
      grid-column: 2;
      grid-row: 1 / span 2;
      align-self: center;
    }
    h2 {
      margin: 0;
    }
    .rows {
      list-style: none;
      margin: 0;
      padding: 0;
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      font-variant-numeric: tabular-nums;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      min-height: var(--list-row-height);
      padding: var(--spacing-sm) var(--list-row-padding-h);
      border-bottom: 1px solid rgba(43, 36, 32, 0.08);
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
  `],
})
export class HarvestClosePage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
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
  /** Fecha de la venta ("AAAA-MM-DD"), vacía hasta que el caficultor la elige. */
  readonly saleDate = signal('');
  readonly saleDateChoice = signal<'today' | 'yesterday' | 'other' | null>(null);
  readonly calendarOpen = signal(false);
  /** El calendario no deja elegir días futuros. */
  protected readonly maxSaleDate = colombiaDay();
  /** "Sábado, 11 de octubre de 2026" (mediodía, para no correr el día por zona horaria). */
  readonly saleDateLabel = computed(() => {
    const date = this.saleDate();
    if (!date) return '';
    const label = new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
  readonly costDescription = signal('');
  readonly costAmount = signal<number | null>(null);

  readonly profit = this.saleAndCostsFacade.profit;

  readonly step = computed<Step>(() => {
    if (this.harvest()?.status === 'active') return 'close';
    return this.saleAndCostsFacade.hasSale() ? 'costs' : 'sale';
  });

  readonly activePickers = computed(() => this.harvestFacade.activeHarvestPickers().filter((p) => p.status === 'active'));
  readonly totalPaid = computed(() => this.harvestFacade.activeHarvestPickers().reduce((sum, p) => sum + p.totalPaid, 0));
  /** Alimentación al cierre: null hasta que el caficultor elige. */
  readonly mealsChoice = signal<'no' | 'yes' | null>(null);
  readonly mealPerDay = signal<number | null>(null);
  readonly closePreview = signal<ClosePreviewResponse | null>(null);
  readonly canClose = computed(
    () => this.mealsChoice() === 'no' || (this.mealsChoice() === 'yes' && (this.mealPerDay() ?? 0) > 0),
  );
  private previewTimer: ReturnType<typeof setTimeout> | null = null;
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

  chooseMeals(choice: 'no' | 'yes'): void {
    this.mealsChoice.set(choice);
    this.schedulePreview(0);
  }

  onMealPerDay(value: number | string | null): void {
    const amount = Number(value);
    this.mealPerDay.set(value === null || value === '' || !(amount > 0) ? null : Math.round(amount));
    this.schedulePreview(400);
  }

  /** null = sin alimentación; undefined = todavía no se puede calcular (falta el valor). */
  private selectedMealPerDay(): number | null | undefined {
    if (this.mealsChoice() === 'no') return null;
    const value = this.mealPerDay();
    return value && value > 0 ? value : undefined;
  }

  private schedulePreview(delayMs: number): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => void this.loadClosePreview(), delayMs);
  }

  private async loadClosePreview(): Promise<void> {
    const harvest = this.harvest();
    const mealPerDay = this.selectedMealPerDay();
    if (!harvest || harvest.status !== 'active' || mealPerDay === undefined) {
      this.closePreview.set(null);
      return;
    }
    try {
      this.closePreview.set(await firstValueFrom(this.harvestService.closePreview(harvest.id, mealPerDay)));
    } catch {
      this.closePreview.set(null); // sin señal: se cierra igual, solo no se ve el resumen
    }
  }

  async closeHarvest(): Promise<void> {
    const harvest = this.harvest();
    const mealPerDay = this.selectedMealPerDay();
    if (!harvest || mealPerDay === undefined || !(await this.confirmClose(harvest.name))) return;

    await this.runStep('No se pudo cerrar la cosecha.', async () => {
      const closed = await this.harvestFacade.closeHarvest(harvest.id, mealPerDay);
      this.harvest.set(closed);
      hapticSuccess();
      const { settledPickers, totalNet } = closed.settlement;
      const toast = await this.toastController.create({
        message: settledPickers > 0
          ? `Cosecha cerrada. Se registró el pago de ${settledPickers} ${settledPickers === 1 ? 'trabajador' : 'trabajadores'}: ${formatCurrency(totalNet)}.`
          : 'Cosecha cerrada.',
        color: 'success',
        duration: 3500,
        position: 'bottom',
      });
      await toast.present();
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
    if (!this.saleDate()) {
      this.errorMessage.set('Elige la fecha de la venta.');
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

  pickSaleDay(day: 'today' | 'yesterday'): void {
    this.saleDateChoice.set(day);
    this.saleDate.set(colombiaDay(day === 'today' ? 0 : 1));
  }

  /** El calendario entrega un ISO ("2026-10-08" o "2026-10-08T…"): se guarda solo el día. */
  onCalendarDate(value: string | string[] | null | undefined): void {
    const iso = Array.isArray(value) ? value[0] : value;
    if (iso) {
      this.saleDate.set(iso.slice(0, 10));
      this.saleDateChoice.set('other');
    }
    this.calendarOpen.set(false);
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
      message: this.closeConfirmMessage(),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar cosecha', role: 'confirm', cssClass: 'alert-button-danger' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  private closeConfirmMessage(): string {
    const preview = this.closePreview();
    const pay = preview && preview.settledPickers > 0
      ? `Se registra el pago de todos los trabajadores: ${formatCurrency(preview.totalNet)}${preview.totalMeals > 0 ? ` (comida descontada: ${formatCurrency(preview.totalMeals)})` : ''}. `
      : '';
    return `${pay}Ya no podrás registrar pesadas ni pagos en esta cosecha. Esta acción no se puede deshacer.`;
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
