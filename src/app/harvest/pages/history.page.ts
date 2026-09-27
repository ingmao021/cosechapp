import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonChip } from '@ionic/angular/ion-chip';
import { IonLabel } from '@ionic/angular/ion-label';
import { addIcons } from 'ionicons';
import { timeOutline, chevronForwardOutline } from 'ionicons/icons';

/**
 * Pestaña Historial — Placeholder para Tarea 7.1.
 * Lista de cosechas cerradas (harvest-history-card molecule).
 * Tap fila → /history/:harvestId (detalle).
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonIcon, IonChip, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Historial</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="mockHistory.length === 0" class="empty-state text-center">
        <ion-icon name="time-outline" size="large" color="medium"></ion-icon>
        <h2 class="text-level-2 ion-margin-top">Sin cosechas cerradas</h2>
        <p class="text-level-4 ion-margin">Las cosechas finalizadas aparecerán aquí.</p>
      </div>

      <ion-card class="history-card" *ngFor="let harvest of mockHistory" (click)="goToDetail(harvest.id)">
        <ion-card-content>
          <ion-card-header>
            <ion-card-title class="text-level-3">{{ harvest.name }}</ion-card-title>
            <ion-card-subtitle class="text-level-4">{{ harvest.openingDate }} – {{ harvest.closingDate }}</ion-card-subtitle>
          </ion-card-header>
          <div class="card-meta">
            <ion-chip color="medium" class="status-chip">
              <ion-label>{{ harvest.status }}</ion-label>
            </ion-chip>
            <div class="profit-info">
              <span class="text-level-4">Ganancia de la cosecha</span>
              <span class="profit-value text-level-2">{{ harvest.profit | currency }}</span>
            </div>
          </div>
          <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: var(--spacing-xl) var(--spacing-md);
    }
    .history-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .history-card:active {
      transform: scale(0.99);
    }
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--spacing-sm);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    .status-chip {
      --height: var(--chip-height);
      --border-radius: var(--chip-radius);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
    }
    .profit-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2dp;
    }
    .profit-value {
      font-family: var(--font-family-display);
      color: var(--color-primary);
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class HistoryPage {
  mockHistory = [
    { id: '1', name: 'Primer pasón 2025', openingDate: '15 ene 2025', closingDate: '20 mar 2025', status: 'Cerrada', profit: 12500000 },
    { id: '2', name: 'Mitaca 2025', openingDate: '10 sep 2025', closingDate: '05 nov 2025', status: 'Cerrada', profit: 8750000 },
    { id: '3', name: 'Primer pasón 2024', openingDate: '20 ene 2024', closingDate: '25 mar 2024', status: 'Cerrada', profit: 11200000 },
  ];

  constructor() {
    addIcons({ timeOutline, chevronForwardOutline });
  }

  goToDetail(harvestId: string): void {
    // TODO: navegar a /history/:harvestId (Tarea 7.2)
    console.log('Ver detalle cosecha:', harvestId);
  }
}