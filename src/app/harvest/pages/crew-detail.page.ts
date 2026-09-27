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
import { addIcons } from 'ionicons';
import { personOutline, addOutline, chevronForwardOutline, archiveOutline } from 'ionicons/icons';
import { SharedModule } from '../../../shared/shared.module';

/**
 * Pantalla Detalle de Cuadrilla — Placeholder para Tarea 3.3.
 * Lista de recolectores asignados + botón agregar.
 */
@Component({
  selector: 'app-crew-detail',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonChip, IonLabel, SharedModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">{{ crewName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="header-actions">
        <h2 class="text-level-2">Recolectores</h2>
        <ion-button fill="solid" color="primary" (click)="addPicker()">
          <ion-icon name="add-outline" slot="start"></ion-icon>
          Agregar recolector
        </ion-button>
      </div>

      @if (mockPickers.length === 0) {
        <ion-card class="empty-state-card">
          <ion-card-content class="text-center">
            <ion-icon name="person-outline" size="large" color="medium"></ion-icon>
            <h3 class="text-level-2 ion-margin-top">Sin recolectores</h3>
            <p class="text-level-4 ion-margin">Agrega recolectores del catálogo o crea nuevos.</p>
          </ion-card-content>
        </ion-card>
      } @else {
        <harvest-picker-card
          *ngFor="let picker of mockPickers"
          [picker]="picker"
          (cardClick)="goToPickerDetail(picker.id)"
          (weighClick)="goToWeighing(picker.id)"
        ></harvest-picker-card>
      }
    </ion-content>
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    .empty-state-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      text-align: center;
      padding: var(--spacing-xl) var(--spacing-md);
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class CrewDetailPage {
  crewName = 'De Huila';

  // Datos mock para placeholder - se conectará con facade en Tarea 3.3
  mockPickers = [
    { id: '1', name: 'Juan Pérez', alias: 'Juancho', dailyKilos: 45.5, weeklyKilos: 280, totalKilos: 850, hasMeals: true, mealDetail: '$15.000/día', avatarUrl: null, status: 'active' as const },
    { id: '2', name: 'María García', alias: null, dailyKilos: 38.0, weeklyKilos: 220, totalKilos: 720, hasMeals: false, mealDetail: '', avatarUrl: null, status: 'active' as const },
    { id: '3', name: 'Carlos López', alias: 'Carlitos', dailyKilos: 52.5, weeklyKilos: 310, totalKilos: 980, hasMeals: true, mealDetail: '$12.000/día', avatarUrl: null, status: 'active' as const },
  ];

  constructor() {
    addIcons({ personOutline, addOutline, chevronForwardOutline, archiveOutline });
  }

  addPicker(): void {
    console.log('Agregar recolector a cuadrilla');
  }

  goToPickerDetail(pickerId: string): void {
    console.log('Ver detalle recolector:', pickerId);
  }

  goToWeighing(pickerId: string): void {
    console.log('Registrar pesada para:', pickerId);
  }
}