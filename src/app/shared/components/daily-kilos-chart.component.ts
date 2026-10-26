import { Component, computed, input, signal } from '@angular/core';
import { KilosPipe } from '../pipes/kilos.pipe';
import { colombiaDateKey, formatKilos } from '../utils';

/** Un día del gráfico ("AAAA-MM-DD"). `inHarvest: false` = antes de abrir la cosecha: sin barra. */
export interface ChartDay {
  date: string;
  kilograms: number;
  inHarvest?: boolean;
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/**
 * Molécula: columnas de kilos por día (Inicio). Una sola serie, así que no lleva leyenda:
 * el título de la tarjeta dice qué se grafica. Hoy va en el verde de marca y los demás
 * días en un paso más claro del mismo verde; la cifra se escribe solo sobre hoy y el día
 * más alto (rotular cada columna no se lee). Tocar una columna muestra su cifra, y el
 * lector de pantalla recibe todas en el aria-label.
 */
@Component({
  selector: 'app-daily-kilos-chart',
  standalone: true,
  imports: [KilosPipe],
  template: `
    <div class="plot" role="img" [attr.aria-label]="summary()">
      @for (day of bars(); track day.date) {
        <div
          class="col"
          [class.col--today]="day.isToday"
          [class.col--selected]="day.date === selected()"
          (click)="toggle(day.date)"
          aria-hidden="true"
        >
          @if (day.inHarvest) {
            <span class="col__bar" [class.col__bar--empty]="day.kilograms === 0" [style.height.%]="day.height"></span>
            @if (day.labelled) {
              <span class="col__value num" [style.bottom]="'calc(' + day.height + '% + 4px)'">{{ day.kilograms | kilos: false }}</span>
            }
          }
        </div>
      }
    </div>
    <div class="days" aria-hidden="true">
      @for (day of bars(); track day.date) {
        <span class="days__label" [class.days__label--today]="day.isToday" [class.days__label--out]="!day.inHarvest">
          {{ day.isToday ? 'Hoy' : day.weekday }}
        </span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    /* Las columnas crecen desde una sola línea base, fina y discreta. El margen de arriba
       deja sitio a la cifra de la columna más alta. */
    .plot {
      display: flex;
      height: 128px;
      padding-top: 22px;
      border-bottom: 1px solid var(--color-separator);
    }
    .col {
      position: relative;
      flex: 1;
      min-width: 0;
      height: 100%;
      cursor: pointer;
    }
    /* Columna fina (máx. 24px) con el extremo redondeado y la base recta. */
    .col__bar {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: min(24px, 64%);
      min-height: 2px;
      border-radius: 4px 4px 0 0;
      background: rgba(var(--ion-color-primary-rgb), 0.42);
      transform: translateX(-50%);
      transition:
        height var(--dur-base) var(--ease-out),
        background-color var(--dur-fast) var(--ease-out);
    }
    .col--today .col__bar,
    .col--selected .col__bar {
      background: var(--color-primary);
    }
    /* Día sin pesadas: una marca mínima en gris, para que se lea "cero", no "falta". */
    .col__bar--empty,
    .col--today .col__bar--empty,
    .col--selected .col__bar--empty {
      background: var(--color-border);
    }
    .col__value {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      white-space: nowrap;
      pointer-events: none;
    }
    .days {
      display: flex;
      margin-top: 6px;
    }
    .days__label {
      flex: 1;
      min-width: 0;
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      text-align: center;
      white-space: nowrap;
    }
    .days__label--today {
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }
    .days__label--out {
      opacity: 0.5;
    }
    @media (prefers-reduced-motion: reduce) {
      .col__bar {
        transition: none;
      }
    }
  `],
})
export class DailyKilosChartComponent {
  /** Del día más antiguo a hoy. */
  readonly days = input.required<ChartDay[]>();

  /** Columna tocada: muestra su cifra. */
  protected readonly selected = signal<string | null>(null);

  protected readonly bars = computed(() => {
    const days = this.days();
    const today = colombiaDateKey(new Date());
    const max = Math.max(0, ...days.map((day) => day.kilograms));
    const peak = days.find((day) => day.kilograms === max && max > 0)?.date;
    const selected = this.selected();
    return days.map((day) => {
      const isToday = day.date === today;
      return {
        ...day,
        inHarvest: day.inHarvest !== false,
        isToday,
        weekday: WEEKDAYS[new Date(day.date).getUTCDay()],
        height: max > 0 ? (day.kilograms / max) * 100 : 0,
        labelled: day.kilograms > 0 && (isToday || day.date === peak || day.date === selected),
      };
    });
  });

  protected readonly summary = computed(() => {
    const parts = this.bars()
      .filter((day) => day.inHarvest)
      .map((day) => `${day.isToday ? 'hoy' : day.weekday} ${formatKilos(day.kilograms)}`);
    return `Kilos por día, últimos ${this.days().length} días: ${parts.join(', ')}.`;
  });

  protected toggle(date: string): void {
    this.selected.update((current) => (current === date ? null : date));
  }
}
