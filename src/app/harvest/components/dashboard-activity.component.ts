import { Component, computed, input, output } from '@angular/core';
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

/** Un día de la actividad: "Hoy", "Ayer" o "lun 20 oct", con sus movimientos. */
interface ActivityDay {
  key: string;
  label: string;
  items: DashboardActivity[];
}

/**
 * Organismo de Inicio: últimas pesadas y pagos, agrupados por día como en el cuaderno.
 * Las pesadas llevan chip verde con balanza y los pagos chip café con billete (ícono y
 * color, nunca solo color). Cada fila abre al recolector (emite `open` con su id); las
 * pesadas que siguen en el teléfono dicen "Por enviar".
 */
@Component({
  selector: 'app-dashboard-activity',
  standalone: true,
  imports: [IonIcon, CurrencyPipe, KilosPipe],
  template: `
    @for (day of days(); track day.key) {
      <h3 class="day">{{ day.label }}</h3>
      <ul class="activity">
        @for (item of day.items; track item.id) {
          <li>
            <button type="button" class="row" (click)="open.emit(item.pickerId)">
              <span class="icon-chip" [class.icon-chip--coffee]="item.type === 'payment'" aria-hidden="true">
                <ion-icon [name]="item.type === 'weighing' ? 'scale-outline' : 'cash-outline'"></ion-icon>
              </span>
              <span class="row__text">
                <span class="row__title">{{ item.displayName }}</span>
                <span class="row__meta">
                  {{ kind(item) }} · {{ time(item.dateTime) }}
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
    }
  `,
  styles: [`
    .activity {
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--font-family-body);
    }
    /* Cabecera de cada día, pequeña y en gris: ordena sin competir con las filas. */
    .day {
      margin: 0;
      padding: 12px var(--spacing-md) 2px;
      font-family: var(--font-family-body);
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
    }
    .day::first-letter {
      text-transform: uppercase;
    }
    /* Los pagos en café (el tono del costal), las pesadas en el verde de siempre. */
    .icon-chip--coffee {
      background: var(--color-coffee-chip);
      color: var(--color-primary-muted);
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

  /** Los movimientos ya llegan del más reciente al más antiguo: se agrupan por día en ese orden. */
  protected readonly days = computed<ActivityDay[]>(() => {
    const today = colombiaDateKey(new Date());
    const yesterday = addDaysToDateKey(today, -1);
    const days: ActivityDay[] = [];
    for (const item of this.items()) {
      const key = colombiaDateKey(item.dateTime);
      let day = days.find((existing) => existing.key === key);
      if (!day) {
        const label =
          key === today ? 'Hoy' : key === yesterday ? 'Ayer' : dayFormat.format(new Date(item.dateTime)).replace(/[.,]/g, '');
        day = { key, label, items: [] };
        days.push(day);
      }
      day.items.push(item);
    }
    return days;
  });

  constructor() {
    addIcons({ cashOutline, cloudUploadOutline, scaleOutline });
  }

  protected kind(item: DashboardActivity): string {
    if (item.type === 'weighing') return 'Pesada';
    return item.isSettlement ? 'Liquidación' : 'Pago';
  }

  /** Hora de Colombia ("10:32"): el día ya lo dice la cabecera del grupo. */
  protected time(dateTime: string): string {
    return timeFormat.format(new Date(dateTime));
  }
}
