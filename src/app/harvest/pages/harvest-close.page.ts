import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonInput } from '@ionic/angular/ion-input';
import { IonList } from '@ionic/angular/ion-list';
import { IonToast } from '@ionic/angular/ion-toast';
import { IonChip } from '@ionic/angular/ion-chip';
import { addIcons } from 'ionicons';
import { arrowBackOutline, addOutline, cashOutline, calculatorOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { KilosPipe } from '../../../shared/pipes/kilos.pipe';

/**
 * Pantalla Cierre de Cosecha — Placeholder para Tarea 5.1.
 * Flujo guiado: Venta → Costos → Resumen final → Confirmar.
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
    IonCardSubtitle,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    IonToast,
    IonChip,
    CurrencyPipe,
    KilosPipe,
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

          @if (grossProfit() > 0) {
            <div class="result-box gross-profit">
              <h3 class="text-level-3">Ganancia bruta</h3>
              <p class="text-level-1 profit-value">{{ grossProfit() | currency }}</p>
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

          @if (costs().length > 0) {
            <ion-list lines="full" class="ion-margin-top">
              <ion-item *ngFor="let cost of costs()">
                <ion-label>
                  <h3 class="text-level-3">{{ cost.description }}</h3>
                  <p class="text-level-4">{{ cost.date | dateFormat:'date' }}</p>
                </ion-label>
                <ion-note slot="end" color="danger">{{ cost.amount | currency }}</ion-note>
              </ion-item>
            </ion-list>
          }

          @if (actualProfit() !== null) {
            <div class="result-box actual-profit">
              <h3 class="text-level-3">Ganancia de la cosecha</h3>
              <p class="text-level-1 profit-value">{{ actualProfit() | currency }}</p>
              <p class="text-level-4">(Ganancia bruta - Costos de producción)</p>
            </div>
            <ion-button fill="solid" color="success" expand="block" class="ion-margin-top" (click)="confirmClose()">
              <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
              Confirmar y archivar cosecha
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
    </ion-content>
  `,
  styles: [`
    .step-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
      transition: border-color 0.2s;
      border: 2dp solid transparent;
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
      border: 2dp solid var(--color-primary);
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
  `],
})
export class HarvestClosePage {
  private readonly router = inject(Router);

  currentStep = signal(1);
  showError = signal(false);
  errorMessage = signal('');
  showSuccess = signal(false);

  // Paso 1: Venta
  dryKilograms = 0;
  salePrice = 0;
  saleDate = new Date().toISOString().split('T')[0];
  grossProfit = signal(0);

  // Paso 2: Costos
  costs = signal<Array<{description: string; amount: number; date: string}>>([]);
  costDescription = '';
  costAmount = 0;
  costDate = new Date().toISOString().split('T')[0];
  actualProfit = signal<number | null>(null);

  // Mock: pagos totales a recolectores (se obtendría del backend)
  private readonly totalPickerPayments = 12500000;

  constructor() {
    addIcons({ arrowBackOutline, addOutline, cashOutline, calculatorOutline, checkmarkCircleOutline });
  }

  calculateGrossProfit(): void {
    if (this.dryKilograms <= 0 || this.salePrice <= 0) {
      this.errorMessage.set('Ingresa kilos secos y precio de venta válidos');
      this.showError.set(true);
      return;
    }

    const saleRevenue = this.dryKilograms * this.salePrice;
    const gross = saleRevenue - this.totalPickerPayments;
    this.grossProfit.set(gross);
    this.nextStep();
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

    this.costs.update(c => [...c, {
      description: this.costDescription,
      amount: this.costAmount,
      date: this.costDate,
    }]);

    this.costDescription = '';
    this.costAmount = 0;
    this.updateActualProfit();
  }

  updateActualProfit(): void {
    if (this.grossProfit() > 0) {
      const totalCosts = this.costs().reduce((sum, c) => sum + c.amount, 0);
      this.actualProfit.set(this.grossProfit() - totalCosts);
    }
  }

  confirmClose(): void {
    if (this.actualProfit() === null) return;

    this.showSuccess.set(true);
    // TODO: llamar HarvestFacade.closeHarvest() + SaleAndCostsFacade en Tarea 5.1
    setTimeout(() => {
      this.router.navigate(['/history']);
    }, 2000);
  }

  goBack(): void {
    if (this.currentStep() === 2) {
      this.currentStep.set(1);
    } else {
      this.router.navigate(['/home']);
    }
  }
}