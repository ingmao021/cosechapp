import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';

/** Un día marcado con un punto de color bajo el número (ej. el día que se abrió la cosecha). */
export interface CalendarMarker {
  date: string; // YYYY-MM-DD
  label: string; // se lee junto al día: "abriste la cosecha"
}

interface CalendarDay {
  iso: string;
  day: number;
  disabled: boolean;
  selected: boolean;
  today: boolean;
  marker: CalendarMarker | undefined;
  ariaLabel: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTH = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const DAY_LABEL = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Molécula: calendario de un mes estilo sistema (Design System §2.6). Celdas redondeadas
 * en cuadrícula de 7, semana desde el lunes, el día elegido relleno en verde, hoy con
 * anillo y días fuera de rango atenuados. Fechas como texto YYYY-MM-DD (sin zona horaria:
 * el día que el caficultor ve es el día que se guarda).
 * Uso:
 *   <app-month-calendar [value]="fecha()" [min]="apertura" [max]="hoy" [today]="hoy"
 *     [markers]="[{ date: apertura, label: 'abriste la cosecha' }]" (dateSelected)="elegir($event)" />
 */
@Component({
  selector: 'app-month-calendar',
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="cal">
      <div class="cal__head">
        <button type="button" class="circle-btn cal__nav" [disabled]="!canGoBack()" aria-label="Mes anterior" (click)="shiftMonth(-1)">
          <ion-icon name="chevron-back" aria-hidden="true"></ion-icon>
        </button>
        <span class="cal__month" aria-live="polite">{{ monthLabel() }}</span>
        <button type="button" class="circle-btn cal__nav" [disabled]="!canGoForward()" aria-label="Mes siguiente" (click)="shiftMonth(1)">
          <ion-icon name="chevron-forward" aria-hidden="true"></ion-icon>
        </button>
      </div>

      <div class="cal__grid">
        @for (weekday of weekdays; track $index) {
          <span class="cal__weekday" aria-hidden="true">{{ weekday }}</span>
        }
        @for (cell of cells(); track $index) {
          @if (cell) {
            <button
              type="button"
              class="cal__day"
              [class.is-selected]="cell.selected"
              [class.is-today]="cell.today"
              [disabled]="cell.disabled"
              [attr.aria-pressed]="cell.selected"
              [attr.aria-current]="cell.today ? 'date' : null"
              [attr.aria-label]="cell.ariaLabel"
              (click)="dateSelected.emit(cell.iso)"
            >
              <span class="num">{{ cell.day }}</span>
              @if (cell.marker) {
                <span class="cal__dot" aria-hidden="true"></span>
              }
            </button>
          } @else {
            <span aria-hidden="true"></span>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .cal__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .cal__month {
      font-family: var(--font-family-body);
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .cal__month::first-letter {
      text-transform: uppercase;
    }
    .cal__nav:disabled {
      opacity: 0.35;
      box-shadow: none;
    }
    .cal__grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }
    .cal__weekday {
      padding-bottom: var(--spacing-xs);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
      text-align: center;
    }
    /* Celda: cuadrada, redondeada y con un fondo apenas visible, como las teclas de un
       teclado: se ve qué se puede tocar sin que la cuadrícula grite. */
    .cal__day {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
      width: 100%;
      min-width: 0;
      min-height: 0;
      max-height: 48px;
      padding: 0;
      border: 0;
      border-radius: var(--radius-md);
      background: rgba(29, 33, 27, 0.04);
      color: var(--color-text);
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition:
        transform var(--dur-release) var(--ease-out),
        background-color var(--dur-fast) var(--ease-out),
        color var(--dur-fast) var(--ease-out);
    }
    .cal__day:active:not(:disabled) {
      transform: scale(0.92);
      transition-duration: var(--dur-press);
    }
    .cal__day.is-today {
      box-shadow: inset 0 0 0 1.5px var(--color-primary-ink);
      font-weight: var(--font-weight-semibold);
    }
    .cal__day.is-selected {
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      font-weight: var(--font-weight-bold);
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.35);
    }
    .cal__day:disabled {
      background: transparent;
      color: var(--color-text-muted);
      opacity: 0.45;
      cursor: default;
    }
    .cal__dot {
      position: absolute;
      bottom: 5px;
      left: 50%;
      width: 5px;
      height: 5px;
      margin-left: -2.5px;
      border-radius: 50%;
      background: var(--color-primary-ink);
    }
    .cal__day.is-selected .cal__dot {
      background: var(--color-text-on-primary);
    }
    @media (prefers-reduced-motion: reduce) {
      .cal__day:active:not(:disabled) {
        transform: none;
      }
    }
  `],
})
export class MonthCalendarComponent {
  /** Día elegido (YYYY-MM-DD) o null. */
  value = input<string | null>(null);
  /** Primer y último día que se pueden elegir (YYYY-MM-DD). */
  min = input<string | null>(null);
  max = input<string | null>(null);
  /** "Hoy" en la zona de la app (Colombia), para el anillo. */
  today = input<string>(new Date().toISOString().slice(0, 10));
  markers = input<CalendarMarker[]>([]);

  dateSelected = output<string>();

  protected readonly weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  /** Mes a la vista: abre en el mes del día elegido (o del máximo, o de hoy). */
  private readonly view = linkedSignal(() => {
    const anchor = this.value() ?? this.max() ?? this.today();
    return { year: Number(anchor.slice(0, 4)), month: Number(anchor.slice(5, 7)) - 1 };
  });

  readonly monthLabel = computed(() => MONTH.format(new Date(Date.UTC(this.view().year, this.view().month, 1))));

  readonly canGoBack = computed(() => {
    const min = this.min();
    return !min || isoOf(this.view().year, this.view().month, 1) > min;
  });

  readonly canGoForward = computed(() => {
    const max = this.max();
    const { year, month } = this.view();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return !max || isoOf(year, month, lastDay) < max;
  });

  /** Celdas del mes: huecos (null) hasta el primer día, contando la semana desde el lunes. */
  readonly cells = computed<(CalendarDay | null)[]>(() => {
    const { year, month } = this.view();
    const min = this.min();
    const max = this.max();
    const value = this.value();
    const today = this.today();
    const markers = this.markers();
    const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const cells: (CalendarDay | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = isoOf(year, month, day);
      const marker = markers.find((m) => m.date === iso);
      const label = DAY_LABEL.format(new Date(Date.UTC(year, month, day)));
      cells.push({
        iso,
        day,
        disabled: (!!min && iso < min) || (!!max && iso > max),
        selected: iso === value,
        today: iso === today,
        marker,
        ariaLabel: [label, iso === today ? 'hoy' : '', marker?.label ?? ''].filter(Boolean).join(', '),
      });
    }
    return cells;
  });

  constructor() {
    addIcons({ chevronBack, chevronForward });
  }

  shiftMonth(step: number): void {
    this.view.update(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + step, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }
}
