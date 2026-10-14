import { Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { addOutline, ellipsisVertical } from 'ionicons/icons';
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
 * Nombre (o alias) + kilos de hoy + saldo pendiente, el botón "Pesar" con ícono y texto y,
 * con [showMenu], el botón ⋮ de opciones (editar, cambiar de cuadrilla, eliminar).
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
          <strong class="num">{{ picker().todayKilograms | kilos }}</strong> hoy
          @if (picker().balanceDue > 0) {
            · Debes <span class="num">{{ picker().balanceDue | currency }}</span>
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
      @if (showMenu()) {
        <button
          type="button"
          class="menu-btn"
          (click)="onMenuClick($event)"
          [attr.aria-label]="'Opciones de ' + picker().displayName"
        >
          <ion-icon name="ellipsis-vertical" aria-hidden="true"></ion-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .picker-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--picker-card-padding);
      min-height: var(--picker-card-min-height);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
      transition: transform var(--dur-press) var(--ease-out);
    }
    .picker-card.clickable {
      cursor: pointer;
      -webkit-user-select: none;
      user-select: none;
      touch-action: manipulation;
    }
    /* La tarjeta entera es tocable: se hunde un poco al presionarla. Si el dedo está en
       "Pesar" o en ⋮, solo se hunde ese botón (:has evita el doble hundimiento). */
    .picker-card.clickable:active:not(:has(button:active)) {
      transform: scale(0.98);
    }
    .picker-avatar {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary);
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
      transition: transform var(--dur-press) var(--ease-out);
    }
    .weigh-btn:active {
      transform: scale(0.95);
    }
    .weigh-btn ion-icon {
      font-size: 20px;
    }
    .menu-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--touch-target-min);
      min-height: var(--touch-target-min);
      margin-right: calc(-1 * var(--spacing-sm));
      border: none;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: background-color var(--dur-fast) ease;
    }
    .menu-btn:active {
      background: var(--color-surface-muted);
    }
    .menu-btn ion-icon {
      font-size: 20px;
    }
    @media (prefers-reduced-motion: reduce) {
      .picker-card.clickable:active:not(:has(button:active)),
      .weigh-btn:active {
        transform: none;
      }
    }
  `],
})
export class HarvestPickerCardComponent {
  picker = input.required<PickerCardData>();
  clickable = input<boolean>(true);
  showMenu = input<boolean>(false);

  cardClick = output<PickerCardData>();
  weighClick = output<PickerCardData>();
  menuClick = output<PickerCardData>();

  /** Iniciales de las dos primeras palabras del nombre (el apellido ya no se pide). */
  readonly initials = computed(() => {
    const { firstName, lastName } = this.picker();
    const words = `${firstName} ${lastName}`.trim().split(/\s+/);
    return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase();
  });

  constructor() {
    addIcons({ addOutline, ellipsisVertical });
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
    this.menuClick.emit(this.picker());
  }

  onCardClick(): void {
    if (this.clickable()) this.cardClick.emit(this.picker());
  }

  onWeighClick(event: Event): void {
    event.stopPropagation();
    this.weighClick.emit(this.picker());
  }
}
