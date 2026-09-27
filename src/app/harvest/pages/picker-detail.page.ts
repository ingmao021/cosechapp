import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonChip } from '@ionic/angular/ion-chip';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { addIcons } from 'ionicons';
import { addOutline, cashOutline, timeOutline, chevronForwardOutline } from 'ionicons/icons';
import { SharedModule } from '../../../shared/shared.module';

/**
 * Pantalla Detalle de Recolector — Placeholder para Tarea 3.4.
 * Pesadas del día, acumulados, chip alimentación, botón "Pagar ahora", historial pagos.
 */
@Component({
  selector: 'app-picker-detail',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonChip, IonLabel, IonItem, IonList, SharedModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">{{ pickerName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Pesadas del día -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title class="text-level-2">Pesadas de hoy</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @if (mockWeighings.length === 0) {
            <p class="text-level-4 text-center ion-padding">Sin pesadas hoy</p>
          } @else {
            <ion-list lines="full">
              <ion-item *ngFor="let w of mockWeighings" lines="full">
                <ion-label>
                  <h3 class="text-level-3">{{ w.kilos | kilos }}</h3>
                  <p class="text-level-4">{{ w.dateTime | dateFormat:'time' }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          }
          <ion-button fill="solid" color="primary" expand="block" class="ion-margin-top" (click)="addWeighing()">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Agregar pesada
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Acumulados -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title class="text-level-2">Acumulados</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="accumulators-grid">
            <div class="acc-item">
              <p class="text-level-4">Esta semana</p>
              <p class="text-level-3">{{ weeklyKilos | kilos }}</p>
            </div>
            <div class="acc-item">
              <p class="text-level-4">Ciclo completo</p>
              <p class="text-level-3">{{ totalKilos | kilos }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Alimentación -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title class="text-level-2">Alimentación</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <app-chip [variant]="hasMeals ? 'meal-with' : 'meal-without'" [icon]="hasMeals ? 'restaurant-outline' : 'restaurant-off-outline'">
            {{ hasMeals ? 'Con alimentación' : 'Sin alimentación' }}
          </app-chip>
          @if (hasMeals && mealDetail) {
            <p class="text-level-4 ion-margin-top">{{ mealDetail }}</p>
          }
        </ion-card-content>
      </ion-card>

      <!-- Pagar ahora -->
      <ion-card class="section-card pay-card">
        <ion-card-header>
          <ion-card-title class="text-level-2">Pagar ahora</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="pay-summary">
            <p class="text-level-3">Monto a pagar: <span class="pay-amount">{{ payAmount | currency }}</span></p>
            <p class="text-level-4">(Kilos totales × precio/kilo - alimentación)</p>
          </div>
          <ion-button fill="solid" color="primary" expand="block" class="ion-margin-top" (click)="payNow()">
            <ion-icon name="cash-outline" slot="start"></ion-icon>
            Pagar ahora
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Historial de pagos -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title class="text-level-2">Historial de pagos</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @if (mockPayments.length === 0) {
            <p class="text-level-4 text-center ion-padding">Sin pagos registrados</p>
          } @else {
            <ion-list lines="full">
              <ion-item *ngFor="let p of mockPayments" lines="full">
                <ion-label>
                  <h3 class="text-level-3">{{ p.amount | currency }}</h3>
                  <p class="text-level-4">{{ p.date | dateFormat:'short' }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          }
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .section-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
    }
    .accumulators-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }
    .acc-item {
      text-align: center;
      padding: var(--spacing-sm);
    }
    .pay-card {
      border: 2dp solid var(--color-primary);
    }
    .pay-summary {
      text-align: center;
      margin-bottom: var(--spacing-sm);
    }
    .pay-amount {
      font-family: var(--font-family-display);
      color: var(--color-primary);
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class PickerDetailPage {
  pickerName = 'Juan Pérez (Juancho)';

  // Datos mock para placeholder
  mockWeighings = [
    { kilos: 25.5, dateTime: new Date('2026-09-26T08:30:00') },
    { kilos: 20.0, dateTime: new Date('2026-09-26T12:15:00') },
  ];

  weeklyKilos = 280;
  totalKilos = 850;
  hasMeals = true;
  mealDetail = '$15.000/día';
  payAmount = 1850000;

  mockPayments = [
    { amount: 500000, date: new Date('2026-09-20') },
    { amount: 300000, date: new Date('2026-09-15') },
  ];

  constructor() {
    addIcons({ addOutline, cashOutline, timeOutline, chevronForwardOutline });
  }

  addWeighing(): void {
    console.log('Agregar pesada');
  }

  payNow(): void {
    console.log('Pagar ahora');
  }
}