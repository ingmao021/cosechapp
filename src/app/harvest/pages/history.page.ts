import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { HistoryFacade } from '../services/history.facade';

/**
 * Pestaña Historial — Tarea 7.1.
 * Lista de cosechas cerradas (harvest-history-card molecule).
 * Tap fila → /history/:harvestId (detalle).
 * Conectado a HistoryFacade para datos reales.
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonIcon, IonChip, IonLabel, CurrencyPipe, DateFormatPipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Historial</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (historyFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (!historyFacade.hasHarvests()) {
        <!-- Estado vacío -->
        <div class="empty-state text-center">
          <ion-icon name="time-outline" size="large" color="medium"></ion-icon>
          <h2 class="text-level-2 ion-margin-top">Sin cosechas cerradas</h2>
          <p class="text-level-4 ion-margin">Las cosechas finalizadas aparecerán aquí.</p>
        </div>
      } @else {
        <!-- Lista de cosechas -->
        @for (harvest of historyFacade.allHarvests(); track harvest.id) {
          <ion-card class="history-card" (click)="goToDetail(harvest.id)">
            <ion-card-content>
              <ion-card-header>
                <ion-card-title class="text-level-3">{{ harvest.name }}</ion-card-title>
                <ion-card-subtitle class="text-level-4">
                  {{ harvest.openingDate | dateFormat:'date' }} – {{ harvest.closingDate | dateFormat:'date' }}
                </ion-card-subtitle>
              </ion-card-header>
              <div class="card-meta">
                <ion-chip color="medium" class="status-chip">
                  <ion-label>{{ harvest.status }}</ion-label>
                </ion-chip>
                <div class="profit-info">
                  <span class="text-level-4">Ganancia de la cosecha</span>
                  <span class="profit-value text-level-2">{{ harvest.profit ? (harvest.profit | currency) : '—' }}</span>
                </div>
              </div>
              <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
            </ion-card-content>
          </ion-card>
        }
      }
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
    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }
  `],
})
export class HistoryPage {
  protected readonly historyFacade = inject(HistoryFacade);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ timeOutline, chevronForwardOutline });

    // Cargar historial al inicializar
    effect(() => {
      this.historyFacade.loadAllHarvests();
    });
  }

  goToDetail(harvestId: string): void {
    this.router.navigate(['/history', harvestId]);
  }
}