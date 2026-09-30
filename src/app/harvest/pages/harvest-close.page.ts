import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonInput } from '@ionic/angular/ion-input';
import { IonList } from '@ionic/angular/ion-list';
import { IonToast } from '@ionic/angular/ion-toast';
import { IonChip } from '@ionic/angular/ion-chip';
import { addIcons } from 'ionicons';
import { arrowBackOutline, addOutline, cashOutline, calculatorOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { SaleAndCostsFacade } from '@sale-and-costs/services/sale-and-costs.facade';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';

/**
 * Pantalla Cierre de Cosecha — Tarea 5.1.
 * Flujo guiado: Venta → Costos → Resumen final → Confirmar.
 * Conectado a HarvestFacade y SaleAndCostsFacade.
 */
@Component({
  selector: 'app-harvest-close',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    IonToast,
    IonChip,
    CurrencyPipe,
    KilosPipe,
    DateFormatPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="text-level-1">Cerrar cosecha</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (saleAndCostsFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else {
        <!-- Header con info de la cosecha -->
        @if (harvestFacade.hasActiveHarvest()) {
          <div class="harvest-header">
            <h2 class="text-level-2">{{ harvestFacade.activeHarvestName() }}</h2>
            <p class="text-level-4">Kilos cereza totales: {{ totalCherryKilos() | kilos }} | Proyección: {{ saleAndCostsFacade.projectedDryKg() | kilos }} secos</p>
          </div>
        }

        <!-- Paso 1: Venta -->
        <ion-card class="step-card" [class.active]="currentStep() === 1">
          <ion-card-header>
            <ion-card-title class="text-level-2">
              <ion-chip color="primary" size="small" mode="md">
                <ion-label>1</ion-label>
              </ion-chip>
              Venta de la cosecha
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="form-grid">
              <ion-item>
                <ion-label position="stacked">Kilos secos reales vendidos</ion-label>
                <ion-input
                  type="number"
                  [(ngModel)]="dryKilograms"
                  placeholder="Ej: 1.250"
                  inputmode="decimal"
                  step="0.1"
                  min="0.1"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Precio de venta (COP/kg)</ion-label>
                <ion-input
                  type="number"
                  [(ngModel)]="salePrice"
                  placeholder="Ej: 2.500"
                  inputmode="numeric"
                  min="1"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Fecha de venta</ion-label>
                <ion-input
                  type="date"
                  [(ngModel)]="saleDate"
                ></ion-input>
              </ion-item>
            </div>

            @if (saleAndCostsFacade.hasSale()) {
              <div class="result-box gross-profit">
                <h3 class="text-level-3">Ganancia bruta</h3>
                <p class="text-level-1 profit-value">{{ saleAndCostsFacade.grossProfit() | currency }}</p>
                <p class="text-level-4">(Venta - Pagos a recolectores)</p>
              </div>
              <ion-button fill="solid" color="primary" expand="block" class="ion-margin-top" (click)="nextStep()">
                <ion-icon name="calculator-outline" slot="start"></ion-icon>
                Continuar a costos
              </ion-button>
            } @else {
              <ion-button fill="solid" color="primary" expand="block" class="ion-margin-top" (click)="calculateGrossProfit()">
                <ion-icon name="calculator-outline" slot="start"></ion-icon>
                Calcular ganancia bruta
              </ion-button>
            }
          </ion-card-content>
        </ion-card>

        <!-- Paso 2: Costos de producción -->
        <ion-card class="step-card" [class.active]="currentStep() === 2">
          <ion-card-header>
            <ion-card-title class="text-level-2">
              <ion-chip color="secondary" size="small" mode="md">
                <ion-label>2</ion-label>
              </ion-chip>
              Costos de producción
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="cost-form">
              <ion-item>
                <ion-label position="stacked">Descripción</ion-label>
                <ion-input
                  type="text"
                  [(ngModel)]="costDescription"
                  placeholder="Ej: Fertilizantes, Mano de obra, Transporte"
                  maxlength="200"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Monto (COP)</ion-label>
                <ion-input
                  type="number"
                  [(ngModel)]="costAmount"
                  placeholder="Ej: 500000"
                  inputmode="numeric"
                  min="1"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Fecha</ion-label>
                <ion-input
                  type="date"
                  [(ngModel)]="costDate"
                ></ion-input>
              </ion-item>

              <ion-button fill="solid" color="secondary" expand="block" class="ion-margin-top" (click)="addCost()">
                <ion-icon name="add-outline" slot="start"></ion-icon>
                Agregar costo
              </ion-button>
            </div>

            @if (saleAndCostsFacade.costs().length > 0) {
              <ion-list lines="full" class="ion-margin-top">
                @for (cost of saleAndCostsFacade.costs(); track cost.id) {
                  <ion-item>
                    <ion-label>
                      <h3 class="text-level-3">{{ cost.description }}</h3>
                      <p class="text-level-4">{{ cost.date | dateFormat:'date' }}</p>
                    </ion-label>
                    <ion-note slot="end" color="danger">{{ cost.amount | currency }}</ion-note>
                  </ion-item>
                }
              </ion-list>
            }

            @if (saleAndCostsFacade.actualProfit() !== 0 || saleAndCostsFacade.hasSale()) {
              <div class="result-box actual-profit">
                <h3 class="text-level-3">Ganancia de la cosecha</h3>
                <p class="text-level-1 profit-value">{{ saleAndCostsFacade.actualProfit() | currency }}</p>
                <p class="text-level-4">(Ganancia bruta - Costos de producción)</p>
              </div>
              <ion-button fill="solid" color="success" expand="block" class="ion-margin-top" (click)="confirmClose()" [disabled]="saleAndCostsFacade.isLoading()">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                {{ saleAndCostsFacade.isLoading() ? 'Procesando...' : 'Confirmar y archivar cosecha' }}
              </ion-button>
            }
          </ion-card-content>
        </ion-card>

        <!-- Toast error -->
        <ion-toast
          [isOpen]="showError()"
          [message]="errorMessage()"
          duration="3000"
          position="bottom"
          color="danger"
          (didDismiss)="showError.set(false)"
        ></ion-toast>

        <!-- Toast éxito -->
        <ion-toast
          [isOpen]="showSuccess()"
          [message]="'Cosecha cerrada y archivada correctamente'"
          duration="3000"
          position="bottom"
          color="success"
          (didDismiss)="showSuccess.set(false)"
        ></ion-toast>
      }
    </ion-content>
  `,
  styles: [`
    .step-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
      transition: border-color 0.2s;
      border: 2px solid transparent;
    }
    .step-card.active {
      border-color: var(--color-primary);
    }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .cost-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .result-box {
      background: var(--color-surface);
      border: 2px solid var(--color-primary);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      margin-top: var(--spacing-md);
      text-align: center;
    }
    .result-box.gross-profit {
      border-color: var(--color-primary);
    }
    .result-box.actual-profit {
      border-color: #28a745;
    }
    .profit-value {
      font-family: var(--font-family-display);
      color: var(--color-primary);
      margin: var(--spacing-xs) 0;
    }
    .result-box.actual-profit .profit-value {
      color: #28a745;
    }
    .harvest-header {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      box-shadow: var(--shadow-card);
    }
    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }
  `],
})
export class HarvestClosePage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly saleAndCostsFacade = inject(SaleAndCostsFacade);

  currentStep = signal(1);
  showError = signal(false);
  errorMessage = signal('');
  showSuccess = signal(false);

  // Paso 1: Venta
  dryKilograms = 0;
  salePrice = 0;
  saleDate = new Date().toISOString().split('T')[0];

  // Paso 2: Costos
  costDescription = '';
  costAmount = 0;
  costDate = new Date().toISOString().split('T')[0];

  // Mock: kilos cereza totales (se obtendría del backend)
  private readonly totalCherryKilos = 6250;

  constructor() {
    addIcons({ arrowBackOutline, addOutline, cashOutline, calculatorOutline, checkmarkCircleOutline });

    // Cargar proyección de kilos secos al inicializar
    effect(() => {
      if (this.harvestFacade.hasActiveHarvest()) {
        this.saleAndCostsFacade.projectDryKilograms(this.totalCherryKilos);
      }
    });
  }

  calculateGrossProfit(): void {
    if (this.dryKilograms <= 0 || this.salePrice <= 0) {
      this.errorMessage.set('Ingresa kilos secos y precio de venta válidos');
      this.showError.set(true);
      return;
    }

    this.saleAndCostsFacade.recordSale({
      harvestId: this.harvestFacade.activeHarvest()!.id,
      actualDryKilograms: this.dryKilograms,
      salePrice: this.salePrice,
      date: this.saleDate,
    }).then(() => {
      this.nextStep();
    }).catch((err: any) => {
      this.errorMessage.set(err?.error?.message ?? 'Error al registrar venta');
      this.showError.set(true);
    });
  }

  nextStep(): void {
    this.currentStep.set(2);
  }

  addCost(): void {
    if (!this.costDescription.trim() || this.costAmount <= 0) {
      this.errorMessage.set('Ingresa descripción y monto válidos');
      this.showError.set(true);
      return;
    }

    this.saleAndCostsFacade.addProductionCost({
      harvestId: this.harvestFacade.activeHarvest()!.id,
      description: this.costDescription,
      amount: this.costAmount,
      date: this.costDate,
    }).then(() => {
      this.costDescription = '';
      this.costAmount = 0;
    }).catch((err: any) => {
      this.errorMessage.set(err?.error?.message ?? 'Error al agregar costo');
      this.showError.set(true);
    });
  }

  confirmClose(): void {
    const harvest = this.harvestFacade.activeHarvest();
    if (!harvest) return;

    this.showSuccess.set(true);
    this.harvestFacade.closeHarvest(harvest.id).then(() => {
      setTimeout(() => {
        this.router.navigate(['/history']);
      }, 2000);
    }).catch((err: any) => {
      this.errorMessage.set(err?.error?.message ?? 'Error al cerrar cosecha');
      this.showError.set(true);
      this.showSuccess.set(false);
    });
  }

  goBack(): void {
    if (this.currentStep() === 2) {
      this.currentStep.set(1);
    } else {
      this.router.navigate(['/home']);
    }
  }
}