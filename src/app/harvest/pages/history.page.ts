import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { IonRefresher } from '@ionic/angular/ion-refresher';
import { IonRefresherContent } from '@ionic/angular/ion-refresher-content';
import { addIcons } from 'ionicons';
import { timeOutline, chevronForwardOutline, alertCircleOutline } from 'ionicons/icons';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { HistoryFacade } from '../services/history.facade';

/**
 * Historial de cosechas (Design System §1.9): cosechas cerradas con sus fechas y la
 * ganancia de la cosecha. Tocar una abre su detalle.
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonSpinner, IonRefresher, IonRefresherContent, CurrencyPipe, DateFormatPipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Historial</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="page">
        @if (historyFacade.error()) {
          <p class="form-error" role="alert">
            <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
            <span>{{ historyFacade.error() }}</span>
          </p>
        }

        @if (historyFacade.isLoading() && !historyFacade.hasHarvests()) {
          <div class="loading-center"><ion-spinner name="crescent"></ion-spinner></div>
        } @else if (!historyFacade.hasHarvests()) {
          <div class="empty-state">
            <ion-icon name="time-outline" aria-hidden="true"></ion-icon>
            <h2 class="text-level-2">Sin cosechas cerradas</h2>
            <p class="text-level-4">Cuando cierres una cosecha, aparecerá aquí con su ganancia.</p>
          </div>
        } @else {
          <ul class="harvest-list">
            @for (harvest of historyFacade.closedHarvests(); track harvest.id) {
              <li>
                <button type="button" class="harvest-row" (click)="goToDetail(harvest.id)">
                  <span class="harvest-row__info">
                    <span class="harvest-row__name">{{ harvest.name }}</span>
                    <span class="harvest-row__dates">
                      {{ harvest.openingDate | dateFormat: 'date' }} – {{ harvest.closingDate | dateFormat: 'date' }}
                    </span>
                  </span>
                  <span class="harvest-row__profit">
                    <span class="harvest-row__label">Ganancia</span>
                    <span
                      class="harvest-row__value"
                      [class.harvest-row__value--loss]="(harvest.actualProfit ?? 0) < 0"
                    >
                      {{ harvest.actualProfit === null ? '—' : (harvest.actualProfit | currency) }}
                    </span>
                  </span>
                  <ion-icon name="chevron-forward-outline" aria-hidden="true"></ion-icon>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--screen-margin);
    }
    .harvest-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--card-gap-vertical);
    }
    .harvest-row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      min-height: var(--picker-card-min-height);
      padding: var(--spacing-md);
      border: none;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      font-family: var(--font-family-body);
      text-align: left;
      color: var(--color-text);
      cursor: pointer;
    }
    .harvest-row__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .harvest-row__name {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
    }
    .harvest-row__dates,
    .harvest-row__label {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .harvest-row__profit {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .harvest-row__value {
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
    }
    .harvest-row__value--loss {
      color: var(--color-accent-alert);
    }
    .harvest-row > ion-icon {
      color: var(--color-text-muted);
      font-size: 20px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xl) var(--spacing-md);
      text-align: center;
    }
    .empty-state ion-icon {
      font-size: 40px;
      color: var(--color-text-muted);
    }
    .empty-state h2,
    .empty-state p {
      margin: 0;
    }
    .loading-center {
      display: flex;
      justify-content: center;
      padding: var(--spacing-xl);
    }
  `],
})
export class HistoryPage {
  protected readonly historyFacade = inject(HistoryFacade);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ timeOutline, chevronForwardOutline, alertCircleOutline });
  }

  /** Cada vez que se entra a la pestaña: puede haberse cerrado una cosecha. */
  ionViewWillEnter(): void {
    void this.historyFacade.loadAllHarvests();
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.historyFacade.loadAllHarvests();
    (event.target as HTMLIonRefresherElement).complete();
  }

  goToDetail(harvestId: string): void {
    this.router.navigate(['/harvest/history', harvestId]);
  }
}
