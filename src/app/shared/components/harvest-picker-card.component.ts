import { Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { KilosPipe } from '../pipes/kilos.pipe';
import { CurrencyPipe } from '../pipes/currency.pipe';

/** Lo que la tarjeta necesita de un recolector (subconjunto de PickerStatsResponse). */
export interface PickerCardData {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  alias: string | null;
  todayKilograms: number;
  balanceDue: number;
  status: 'active' | 'archived';
}

/**
 * Molécula: tarjeta de recolector en la lista de una cuadrilla (Design System §1.4, §2.3).
 * Nombre (o alias) + kilos de hoy + saldo pendiente, y el botón "Pesar" con ícono y texto.
 */
@Component({
  selector: 'app-harvest-picker-card',
  standalone: true,
  imports: [IonIcon, KilosPipe, CurrencyPipe],
  template: `
    <div class="picker-card" [class.clickable]="clickable()" (click)="onCardClick()">
      <div class="picker-avatar" aria-hidden="true">{{ initials() }}</div>

      <div class="picker-info">
        <p class="picker-name">{{ picker().displayName }}</p>
        @if (picker().alias) {
          <p class="picker-real-name">{{ picker().firstName }} {{ picker().lastName }}</p>
        }
        <p class="picker-meta">
          <strong>{{ picker().todayKilograms | kilos }}</strong> hoy
          @if (picker().balanceDue > 0) {
            · Debes {{ picker().balanceDue | currency }}
          }
        </p>
      </div>

      @if (picker().status === 'active') {
        <button
          type="button"
          class="weigh-btn"
          (click)="onWeighClick($event)"
          [attr.aria-label]="'Registrar pesada de ' + picker().displayName"
        >
          <ion-icon name="add-outline" aria-hidden="true"></ion-icon>
          Pesar
        </button>
      }
    </div>
  `,
  styles: [`
    .picker-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--picker-card-padding);
      min-height: var(--picker-card-min-height);
      border-radius: var(--picker-card-radius);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
    }
    .picker-card.clickable {
      cursor: pointer;
    }
    .picker-card.clickable:active {
      transform: scale(0.99);
    }
    .picker-avatar {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      font-family: var(--font-family-body);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
    }
    .picker-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .picker-info p {
      margin: 0;
      font-family: var(--font-family-body);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .picker-name {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }
    .picker-real-name,
    .picker-meta {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .picker-meta strong {
      color: var(--color-text);
    }
    .weigh-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      min-height: var(--touch-target-min);
      padding: 0 var(--spacing-md);
      border: none;
      border-radius: var(--radius-full);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      cursor: pointer;
    }
    .weigh-btn ion-icon {
      font-size: 20px;
    }
  `],
})
export class HarvestPickerCardComponent {
  picker = input.required<PickerCardData>();
  clickable = input<boolean>(true);

  cardClick = output<PickerCardData>();
  weighClick = output<PickerCardData>();

  readonly initials = computed(() => {
    const { firstName, lastName } = this.picker();
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  });

  constructor() {
    addIcons({ addOutline });
  }

  onCardClick(): void {
    if (this.clickable()) this.cardClick.emit(this.picker());
  }

  onWeighClick(event: Event): void {
    event.stopPropagation();
    this.weighClick.emit(this.picker());
  }
}
