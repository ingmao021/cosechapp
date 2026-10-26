import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { cashOutline, cloudUploadOutline, scaleOutline } from 'ionicons/icons';
import { DashboardActivity } from '../services/dashboard.facade';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { addDaysToDateKey, colombiaDateKey } from '../../shared/utils';

const timeFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const dayFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/**
 * Organismo de Inicio: últimas pesadas y pagos. Cada fila abre al recolector (emite
 * `open` con su id); las pesadas que siguen en el teléfono dicen "Por enviar".
 */
@Component({
  selector: 'app-dashboard-activity',
  standalone: true,
  imports: [IonIcon, CurrencyPipe, KilosPipe],
  template: `
    <ul class="activity">
      @for (item of items(); track item.id) {
        <li>
          <button type="button" class="row" (click)="open.emit(item.pickerId)">
            <span class="icon-chip" aria-hidden="true">
              <ion-icon [name]="item.type === 'weighing' ? 'scale-outline' : 'cash-outline'"></ion-icon>
            </span>
            <span class="row__text">
              <span class="row__title">{{ item.displayName }}</span>
              <span class="row__meta">
                {{ kind(item) }} · {{ when(item.dateTime) }}
                @if (item.pending) {
                  · <ion-icon name="cloud-upload-outline" aria-hidden="true"></ion-icon> Por enviar
                }
              </span>
            </span>
            <span class="row__value num">
              @if (item.type === 'weighing') {
                {{ item.kilograms | kilos }}
              } @else {
                {{ item.amount | currency: true : false }}
              }
            </span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: [`
    .activity {
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--font-family-body);
    }
    /* Separador desde donde empieza el texto, no desde el borde. */
    li + li .row::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      left: calc(var(--spacing-md) + var(--icon-chip-size) + var(--row-gap));
      height: 1px;
      background: var(--color-separator);
    }
    .row {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--row-gap);
      width: 100%;
      min-height: var(--list-row-height);
      margin: 0;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 0;
      background: transparent;
      color: var(--color-text);
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: background-color var(--dur-release) var(--ease-out);
    }
    .row:active {
      background: var(--color-pressed);
      transition-duration: var(--dur-press);
    }
    .row__text {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }
    .row__title {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      overflow-wrap: anywhere;
    }
    .row__meta {
      font-size: var(--font-size-footnote);
      color: var(--color-text-muted);
    }
    .row__meta ion-icon {
      font-size: 14px;
      vertical-align: -2px;
    }
    .row__value {
      flex-shrink: 0;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
    }
  `],
})
export class DashboardActivityComponent {
  readonly items = input.required<DashboardActivity[]>();
  /** Id del recolector de la fila tocada. */
  readonly open = output<string>();

  constructor() {
    addIcons({ cashOutline, cloudUploadOutline, scaleOutline });
  }

  protected kind(item: DashboardActivity): string {
    if (item.type === 'weighing') return 'Pesada';
    return item.isSettlement ? 'Liquidación' : 'Pago';
  }

  /** "hoy 10:32", "ayer 15:10" o "lun 20 oct", en hora de Colombia. */
  protected when(dateTime: string): string {
    const day = colombiaDateKey(dateTime);
    const today = colombiaDateKey(new Date());
    const time = timeFormat.format(new Date(dateTime));
    if (day === today) return `hoy ${time}`;
    if (day === addDaysToDateKey(today, -1)) return `ayer ${time}`;
    return dayFormat.format(new Date(dateTime)).replace(/[.,]/g, '');
  }
}
