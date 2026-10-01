import { Component, effect, inject, computed } from '@angular/core';
import { IonNote } from '@ionic/angular/ion-note';
import { IonSpinner } from '@ionic/angular/ion-spinner';
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
    IonSpinner,
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
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (!historyFacade.selectedHarvest()) {
        <div class="empty-state text-center">
          <ion-icon name="alert-circle-outline" size="large" color="warning"></ion-icon>
          <h2 class="text-level-2 ion-margin-top">Cosecha no encontrada</h2>
          <p class="text-level-4 ion-margin">No se pudo cargar el detalle de la cosecha.</p>
          <ion-button fill="solid" color="primary" class="ion-margin-top" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
            Volver al historial
          </ion-button>
        </div>
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
              <ion-list lines="full">
                @for (p of pickers(); track p.id) {
                  <ion-item lines="full">
                    <ion-label>
                      <h3 class="text-level-3">
                        {{ p.displayName }}
                        @if (p.status === 'archived') {
                          <span class="archived">· Archivado</span>
                        }
                      </h3>
                      <p class="text-level-4">{{ p.totalKilograms | kilos }} · Pagado {{ p.totalPaid | currency }}</p>
                      @if (p.totalMealDeductions > 0) {
                        <p class="text-level-4 meals">
                          <ion-icon name="restaurant-outline" aria-hidden="true"></ion-icon>
                          Alimentación descontada: {{ p.totalMealDeductions | currency }}
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
    }
    .due,
    .cost-value,
    .profit-value.loss {
      color: var(--color-accent-alert);
    }
    .profit-value {
      color: var(--color-primary);
    }
    .section-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
    }
    .sale-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid var(--color-border);
    }
    .sale-row.total {
      border-bottom: 2px solid var(--color-primary);
      font-weight: bold;
    }
    .total-costs {
      display: flex;
      justify-content: space-between;
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--color-border);
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
      border-bottom: 1px solid var(--color-border);
    }
    .summary-row.final {
      border-bottom: none;
      border-top: 2px solid var(--color-primary);
      padding-top: var(--spacing-sm);
      margin-top: var(--spacing-xs);
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

  totalPayments = computed(() => {
    const pickers = this.pickers();
    return pickers.reduce((sum, p) => sum + (p.totalPaid ?? 0), 0);
  });

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