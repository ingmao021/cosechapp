import { Component, effect, inject, computed } from '@angular/core';
import { IonNote } from '@ionic/angular/ion-note';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, cashOutline, timeOutline, personOutline, restaurantOutline, calculatorOutline, alertCircleOutline, arrowBackOutline } from 'ionicons/icons';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { EmptyStateComponent, ListSkeletonComponent } from '@shared/components';
import { HistoryFacade } from '../services/history.facade';

/**
 * Pantalla Detalle de Cosecha Cerrada — Tarea 7.2.
 * Secciones: Recolectores (con sus pagos), Venta, Costos, Ganancia bruta, Ganancia de la cosecha.
 * Solo lectura (conectado a HistoryFacade).
 */
@Component({
  selector: 'app-harvest-history-detail',
  standalone: true,
  imports: [
    IonButtons,
    IonBackButton,
    IonNote,
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
    IonLabel,
    IonItem,
    IonList,
    CurrencyPipe,
    DateFormatPipe,
    KilosPipe,
    EmptyStateComponent,
    ListSkeletonComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/history" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">{{ harvestName() }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (historyFacade.isLoading()) {
        <app-list-skeleton [rows]="4" [avatar]="false"></app-list-skeleton>
      } @else if (!historyFacade.selectedHarvest()) {
        <app-empty-state icon="alert-circle-outline" title="Cosecha no encontrada">
          <p>No se pudo cargar el detalle de la cosecha.</p>
          <ion-button fill="solid" color="primary" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
            Volver al historial
          </ion-button>
        </app-empty-state>
      } @else {
        <p class="detail-dates text-level-4">
          {{ openingDate() | dateFormat: 'date' }} – {{ closingDate() | dateFormat: 'date' }}
        </p>

        <!-- Recolectores y pagos -->
        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Recolectores y pagos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (pickers().length === 0) {
              <p class="text-level-4 text-center ion-padding">Sin recolectores registrados</p>
            } @else {
              <div class="workers-total">
                <span class="text-level-4">Total de los trabajadores</span>
                <strong class="text-level-2">{{ workersTotal() | currency }}</strong>
                <span class="text-level-4">
                  En efectivo {{ totalPayments() | currency }}
                  @if (totalMeals() > 0) { · comida {{ totalMeals() | currency }} }
                </span>
              </div>
              <ion-list lines="full">
                @for (p of pickers(); track p.id) {
                  <ion-item lines="full" button detail (click)="openPicker(p.id)">
                    <ion-label>
                      <h3 class="text-level-3">
                        {{ p.displayName }}
                        @if (p.status === 'archived') {
                          <span class="archived">· Archivado</span>
                        }
                      </h3>
                      <p class="text-level-4">{{ p.totalKilograms | kilos }} · Total {{ p.totalPaid + p.totalMealDeductions | currency }}</p>
                      @if (p.totalMealDeductions > 0) {
                        <p class="text-level-4 meals">
                          <ion-icon name="restaurant-outline" aria-hidden="true"></ion-icon>
                          Comida descontada: {{ p.totalMealDeductions | currency }}
                        </p>
                      }
                      @if (p.balanceDue > 0) {
                        <p class="text-level-4 due">Quedó debiendo: {{ p.balanceDue | currency }}</p>
                      }
                    </ion-label>
                  </ion-item>
                }
              </ion-list>
            }
          </ion-card-content>
        </ion-card>

        <!-- Venta -->
        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Venta</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (selectedHarvest()?.sale) {
              <div class="sale-info">
                <div class="sale-row">
                  <span class="text-level-4">Kilos secos vendidos</span>
                  <span class="text-level-3">{{ selectedHarvest()!.sale!.actualDryKilograms | kilos }}</span>
                </div>
                <div class="sale-row">
                  <span class="text-level-4">Precio de venta</span>
                  <span class="text-level-3">{{ selectedHarvest()!.sale!.salePrice | currency }}/kg</span>
                </div>
                <div class="sale-row">
                  <span class="text-level-4">Fecha de venta</span>
                  <span class="text-level-4">{{ selectedHarvest()!.sale!.date | dateFormat:'date' }}</span>
                </div>
                <div class="sale-row total">
                  <span class="text-level-3">Ingreso bruto</span>
                  <span class="text-level-2 profit-value">{{ selectedHarvest()!.sale!.grossRevenue | currency }}</span>
                </div>
              </div>
            } @else {
              <p class="text-level-4 text-center ion-padding">Todavía no registras la venta de esta cosecha.</p>
              <ion-button expand="block" color="primary" (click)="resumeClose()">
                <ion-icon name="cash-outline" slot="start"></ion-icon>
                Registrar venta y costos
              </ion-button>
            }
          </ion-card-content>
        </ion-card>

        <!-- Costos de producción -->
        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Costos de producción</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (selectedHarvest()?.costs && selectedHarvest()!.costs!.length > 0) {
              <ion-list lines="full">
                @for (c of selectedHarvest()!.costs!; track c.id) {
                  <ion-item lines="full">
                    <ion-label>
                      <h3 class="text-level-3">{{ c.description }}</h3>
                      <p class="text-level-4">{{ c.date | dateFormat:'date' }}</p>
                    </ion-label>
                    <ion-note slot="end" color="danger">{{ c.amount | currency }}</ion-note>
                  </ion-item>
                }
              </ion-list>
              <div class="total-costs">
                <span class="text-level-3">Total costos</span>
                <span class="text-level-2 cost-value">{{ totalCosts() | currency }}</span>
              </div>
            } @else {
              <p class="text-level-4 text-center ion-padding">Sin costos registrados</p>
            }
          </ion-card-content>
        </ion-card>

        <!-- Resumen de ganancias -->
        <ion-card class="section-card pay-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Resumen de ganancias</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="profit-summary">
              <div class="summary-row">
                <span class="text-level-4">Ingreso por venta</span>
                <span class="text-level-3">{{ selectedHarvest()?.sale?.grossRevenue ?? 0 | currency }}</span>
              </div>
              <div class="summary-row">
                <span class="text-level-4">Pagos a recolectores</span>
                <span class="text-level-3 cost-value">− {{ totalPayments() | currency }}</span>
              </div>
              <div class="summary-row">
                <span class="text-level-4">Ganancia bruta</span>
                <span class="text-level-3 profit-value">{{ selectedHarvest()?.grossProfit | currency }}</span>
              </div>
              <div class="summary-row">
                <span class="text-level-4">Costos de producción</span>
                <span class="text-level-3 cost-value">− {{ totalCosts() | currency }}</span>
              </div>
              <div class="summary-row final">
                <span class="text-level-2">Ganancia de la cosecha</span>
                <span class="text-level-1 profit-value" [class.loss]="(selectedHarvest()?.actualProfit ?? 0) < 0">{{ selectedHarvest()?.actualProfit | currency }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .workers-total {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 0 var(--spacing-md);
      border-bottom: 1px solid var(--color-separator);
    }
    .detail-dates {
      margin: 0 0 var(--spacing-md);
    }
    .archived {
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
    }
    .meals {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    .meals ion-icon {
      font-size: 16px;
      color: var(--color-secondary);
    }
    .due,
    .cost-value,
    .profit-value.loss {
      color: var(--color-accent-alert);
    }
    .profit-value {
      color: var(--color-primary-ink);
    }
    /* Un solo relleno de 16dp: el ion-card global ya trae padding y el header/content de
       Ionic suman el suyo, lo que sangraba el contenido el doble. */
    .section-card {
      --card-shadow: var(--shadow-card);
      margin: 0 0 var(--spacing-md);
      padding: 0;
      font-variant-numeric: tabular-nums;
    }
    .section-card ion-card-header {
      padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
    }
    .section-card ion-card-content {
      padding: 0 var(--spacing-md) var(--spacing-md);
    }
    .section-card ion-list {
      padding: 0;
    }
    .section-card ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }
    .section-card ion-item:last-child {
      --border-width: 0;
      --inner-border-width: 0;
    }
    /* Título de tarjeta como encabezado de grupo del sistema: 17 semibold, no 20 bold. */
    .section-card ion-card-title {
      font-family: var(--font-family-body);
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0;
    }
    /* Las cifras que responden la pregunta ("¿cuánto gané?", "¿cuánto pagué?") van en
       slab, como el resto de cifras clave de la app. */
    .workers-total strong,
    .summary-row.final > :last-child {
      font-family: var(--font-family-display);
      font-weight: var(--font-weight-bold);
    }
    .workers-total strong {
      font-size: var(--font-size-xl);
    }
    .sale-row,
    .summary-row,
    .total-costs {
      align-items: baseline;
      gap: var(--spacing-sm);
    }
    .sale-row > :last-child,
    .summary-row > :last-child,
    .total-costs > :last-child {
      text-align: right;
      overflow-wrap: anywhere;
    }
    .sale-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid var(--color-separator);
    }
    .sale-row.total {
      border-bottom: none;
      padding-top: var(--spacing-sm);
      font-weight: bold;
    }
    .total-costs {
      display: flex;
      justify-content: space-between;
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--color-separator);
    }
    .profit-summary {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid var(--color-separator);
    }
    /* El resultado final va en un bloque propio, no tras una raya: se lee como la respuesta. */
    .summary-row.final {
      flex-wrap: wrap;
      border-bottom: none;
      margin-top: var(--spacing-sm);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      background: var(--color-primary-soft);
    }
    .summary-row.final:has(.loss) {
      background: rgba(122, 46, 34, 0.08);
    }
  `],
})
export class HarvestHistoryDetailPage {
  protected readonly historyFacade = inject(HistoryFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  harvestId = computed(() => this.route.snapshot.paramMap.get('harvestId'));

  // Computed para acceder a datos del facade
  selectedHarvest = this.historyFacade.selectedHarvest;

  harvestName = computed(() => this.selectedHarvest()?.harvest?.name ?? 'Cosecha');
  openingDate = computed(() => this.selectedHarvest()?.harvest?.openingDate ?? '');
  closingDate = computed(() => this.selectedHarvest()?.harvest?.closingDate ?? '');

  pickers = computed(() => this.selectedHarvest()?.pickers ?? []);

  totalCosts = computed(() => {
    const costs = this.selectedHarvest()?.costs ?? [];
    return costs.reduce((sum, c) => sum + c.amount, 0);
  });

  /** Efectivo pagado a todos los trabajadores (anticipos y liquidación al cierre). */
  totalPayments = computed(() => {
    const pickers = this.pickers();
    return pickers.reduce((sum, p) => sum + (p.totalPaid ?? 0), 0);
  });

  totalMeals = computed(() => this.pickers().reduce((sum, p) => sum + (p.totalMealDeductions ?? 0), 0));

  /** Lo que ganaron todos: efectivo + comida descontada. */
  workersTotal = computed(() => this.totalPayments() + this.totalMeals());

  openPicker(pickerId: string): void {
    const id = this.harvestId();
    if (id) this.router.navigate(['/harvest/history', id, 'pickers', pickerId]);
  }

  constructor() {
    addIcons({ chevronForwardOutline, cashOutline, timeOutline, personOutline, restaurantOutline, calculatorOutline, alertCircleOutline, arrowBackOutline });

    // Cargar detalle al navegar a la página
    effect(() => {
      const id = this.harvestId();
      if (id) {
        this.historyFacade.loadHarvestDetail(id);
      } else {
        this.historyFacade.clearSelectedHarvest();
      }
    });
  }

  resumeClose(): void {
    const id = this.harvestId();
    if (id) this.router.navigate(['/harvest/close', id]);
  }

  goBack(): void {
    this.historyFacade.clearSelectedHarvest();
    this.router.navigate(['/history'], { replaceUrl: true });
  }
}