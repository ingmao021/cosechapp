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
import { peopleOutline, addOutline, chevronForwardOutline } from 'ionicons/icons';

/**
 * Pantalla Cuadrillas — Placeholder para Tarea 3.2.
 * Lista de cuadrillas de la cosecha activa + botón crear nueva.
 */
@Component({
  selector: 'app-crews',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonChip, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Cuadrillas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="header-actions">
        <h2 class="text-level-2">Cuadrillas de la cosecha</h2>
        <ion-button fill="solid" color="primary" (click)="createCrew()">
          <ion-icon name="add-outline" slot="start"></ion-icon>
          Nueva cuadrilla
        </ion-button>
      </div>

      @if (false) {
        <!-- Placeholder: lista vacía -->
        <ion-card class="empty-state-card">
          <ion-card-content class="text-center">
            <ion-icon name="people-outline" size="large" color="medium"></ion-icon>
            <h3 class="text-level-2 ion-margin-top">Sin cuadrillas</h3>
            <p class="text-level-4 ion-margin">Crea tu primera cuadrilla para agrupar recolectores.</p>
          </ion-card-content>
        </ion-card>
      } @else {
        <!-- Placeholder: lista con datos mock -->
        <ion-card class="crew-card" *ngFor="let crew of mockCrews" (click)="goToCrewDetail(crew.id)">
          <ion-card-content>
            <div class="crew-info">
              <ion-card-title class="text-level-3">{{ crew.name }}</ion-card-title>
              <ion-card-subtitle class="text-level-4">{{ crew.pickersCount }} recolectores</ion-card-subtitle>
            </div>
            <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
          </ion-card-content>
        </ion-card>
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
    .crew-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
      cursor: pointer;
    }
    .crew-info {
      flex: 1;
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class CrewsPage {
  mockCrews = [
    { id: '1', name: 'De Huila', pickersCount: 5 },
    { id: '2', name: 'Misma vereda', pickersCount: 3 },
    { id: '3', name: 'Contratados', pickersCount: 4 },
  ];

  constructor() {
    addIcons({ peopleOutline, addOutline, chevronForwardOutline });
  }

  createCrew(): void {
    // TODO: modal crear cuadrilla (Tarea 3.2)
    console.log('Crear cuadrilla');
  }

  goToCrewDetail(crewId: string): void {
    // TODO: navegar a /harvest/crews/:crewId (Tarea 3.3)
    console.log('Ver cuadrilla:', crewId);
  }
}