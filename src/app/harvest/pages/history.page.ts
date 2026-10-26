import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonRefresher } from '@ionic/angular/ion-refresher';
import { IonRefresherContent } from '@ionic/angular/ion-refresher-content';
import { addIcons } from 'ionicons';
import { timeOutline, leafOutline, alertCircleOutline } from 'ionicons/icons';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { HistoryFacade } from '../services/history.facade';
import { EmptyStateComponent, ListSkeletonComponent, NavRowComponent } from '@shared/components';

/**
 * Historial de cosechas (Design System §1.9): cosechas cerradas con sus fechas y la
 * ganancia de la cosecha. Tocar una abre su detalle.
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonRefresher, IonRefresherContent, CurrencyPipe, DateFormatPipe, EmptyStateComponent, ListSkeletonComponent, NavRowComponent],
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
          <app-list-skeleton [rows]="3" [avatar]="false"></app-list-skeleton>
        } @else if (!historyFacade.hasHarvests()) {
          <app-empty-state icon="time-outline" title="Sin cosechas cerradas">
            <p>Cuando cierres una cosecha, aparecerá aquí con su ganancia.</p>
          </app-empty-state>
        } @else {
          <ul class="harvest-list stagger-in">
            @for (harvest of historyFacade.closedHarvests(); track harvest.id) {
              <li>
                @let opened = harvest.openingDate | dateFormat: 'date';
                @let closed = harvest.closingDate | dateFormat: 'date';
                <button app-nav-row icon="leaf-outline" [label]="harvest.name" [subtitle]="dateRange(opened, closed)" (click)="goToDetail(harvest.id)">
                  <span nav-row-end class="profit">
                    <span class="profit__label">Ganancia</span>
                    <span
                      class="profit__value num"
                      [class.profit__value--loss]="(harvest.actualProfit ?? 0) < 0"
                      [class.profit__value--even]="(harvest.actualProfit ?? 0) === 0"
                    >
                      {{ harvest.actualProfit === null ? '—' : keepAmount(harvest.actualProfit | currency) }}
                    </span>
                  </span>
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
    /* Ganancia al final de la fila: nombre pequeño arriba, cifra en verde (o rojo tierra). */
    .profit {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 1;
      max-width: 45%;
      font-family: var(--font-family-body);
    }
    .profit__label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }
    .profit__value {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary-ink);
      overflow-wrap: break-word;
      text-align: right;
    }
    .profit__value--loss {
      color: var(--color-accent-alert);
    }
    /* Sin ganancia ni pérdida: color neutro, el verde se reserva para ganar. */
    .profit__value--even {
      color: var(--color-text);
    }
  `],
})
export class HistoryPage {
  protected readonly historyFacade = inject(HistoryFacade);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ timeOutline, leafOutline, alertCircleOutline });
  }

  /** "−$ 16.000": en la lista sin " COP" (toda la app es en pesos) y con el signo y el
   *  símbolo pegados a la cifra, para que el monto nunca se parta. */
  keepAmount(amount: string): string {
    return amount.replace(/\s*COP$/, '').replace(/\$ /, '$ ').replace(/^([−-])/, '$1⁠');
  }

  /** "3 oct 2026 – 20 oct 2026", o un solo día si abrió y cerró el mismo día. Día y mes
   *  nunca se separan ("3 oct"); el año puede bajar de línea con letra grande. */
  dateRange(opened: string, closed: string): string {
    const keep = (date: string) => date.replace(/^(\S+) (\S+)/, '$1 $2');
    return closed && closed !== opened ? `${keep(opened)} – ${keep(closed)}` : keep(opened);
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
