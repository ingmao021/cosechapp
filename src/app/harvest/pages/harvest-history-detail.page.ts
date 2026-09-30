import { Component, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { IonLabel } from '@ionic/angular/ion-label';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, cashOutline, timeOutline, personOutline, restaurantOutline, calculatorOutline } from 'ionicons/icons';
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
        <div class="detail-header">
          <h2 class="text-level-2">{{ harvestName() }}</h2>
          <p class="text-level-4">{{ openingDate() }} – {{ closingDate() }}</p>
        </div>

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
                      <h3 class="text-level-3">{{ p.harvestAlias ?? p.workerId }}</h3>
                      <p class="text-level-4">{{ p.totalKilograms | kilos }} total • {{ p.totalPaid | currency }} pagado</p>
                      @if (p.hasMeals) {
                        <p class="text-level-4" style="color: var(--color-primary);">
                          <ion-icon name="restaurant-outline" size="small"></ion-icon>
                          Con alimentación: {{ p.mealDetail }}
                        </p>
                      }
                      <p class="text-level-4">Estado: {{ p.status }}</p>
                    </ion-label>
                    <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
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
              <p class="text-level-4 text-center ion-padding">Sin datos de venta</p>
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
                <span class="text-level-2" style="color: #dc3545;">{{ totalCosts() | currency }}</span>
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
                <span class="text-level-4">Pagos a recolectores</span>
                <span class="text-level-3">{{ totalPayments() | currency }}</span>
              </div>
              <div class="summary-row">
                <span class="text-level-4">Ingreso por venta</span>
                <span class="text-level-3">{{ selectedHarvest()?.sale?.grossRevenue | currency }}</span>
              </div>
              <div class="summary-row">
                <span class="text-level-4">Ganancia bruta</span>
                <span class="text-level-3 profit-value">{{ selectedHarvest()?.grossProfit | currency }}</span>
              </div>
              <div class="summary-row">
                <span class="text-level-4">Costos de producción</span>
                <span class="text-level-3" style="color: #dc3545;">{{ totalCosts() | currency }}</span>
              </div>
              <div class="summary-row final">
                <span class="text-level-2">Ganancia de la cosecha</span>
                <span class="text-level-1 profit-value" style="color: #28a745;">{{ selectedHarvest()?.actualProfit | currency }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .detail-header {
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
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
      border-top: 2px solid #28a745;
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

  goBack(): void {
    this.historyFacade.clearSelectedHarvest();
    this.router.navigate(['/history']);
  }
}