import { Component, input, output } from '@angular/core';
import { KilosPipe } from '../pipes/kilos.pipe';
import { AppChipComponent } from './app-chip.component';

/**
 * Molécula: Tarjeta de recolector en lista de cuadrilla
 * Espec Design System: 64dp min alto, 16dp padding, radius 12dp, avatar/icono 24dp, nombre/alias + kilos día
 * Uso: <app-harvest-picker-card [picker]="pickerData" (cardClick)="onPickerClick()" (weighClick)="onWeigh()" />
 * Implementado con HTML puro + CSS Design Tokens (sin componentes Ionic)
 */
export interface PickerCardData {
  id: string;
  name: string;
  alias?: string;
  dailyKilos: number;
  weeklyKilos: number;
  totalKilos: number;
  hasMeals: boolean;
  mealDetail?: string;
  avatarUrl?: string;
  status: 'active' | 'archived';
}

@Component({
  selector: 'app-harvest-picker-card',
  standalone: true,
  imports: [KilosPipe, AppChipComponent],
  template: `
    <div
      class="picker-card"
      [class.clickable]="clickable()"
      (click)="onCardClick($event)"
    >
      <div class="picker-avatar">
        @if (picker().avatarUrl) {
          <img [src]="picker().avatarUrl" [alt]="picker().name" />
        } @else {
          <span class="avatar-icon">👤</span>
        }
      </div>

      <div class="picker-info">
        <h3 class="picker-name text-level-3">
          {{ picker().alias || picker().name }}
          @if (picker().alias) {
            <span class="real-name text-level-4">({{ picker().name }})</span>
          }
        </h3>
        <div class="picker-meta text-level-4">
          <span class="daily-kilos">
            <span class="icon">⚖️</span>
            {{ picker().dailyKilos | kilos }}
            hoy
          </span>
        </div>
      </div>

      <div class="picker-actions">
        <app-chip
          [variant]="picker().hasMeals ? 'meal-with' : 'meal-without'"
          [icon]="picker().hasMeals ? 'restaurant-outline' : 'restaurant-off-outline'"
        >
          {{ picker().hasMeals ? 'Con alimentación' : 'Sin alimentación' }}
        </app-chip>
        <button
          class="icon-btn"
          (click)="onWeighClick($event)"
          [attr.aria-label]="'Registrar pesada para ' + picker().name"
        >
          <span class="icon">➕</span>
        </button>
      </div>
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
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .picker-card:hover,
    .picker-card:active {
      transform: scale(0.99);
      box-shadow: 0 2dp 6dp rgba(43,36,32,0.16);
    }
    .picker-card.clickable {
      cursor: pointer;
    }
    .picker-avatar {
      width: var(--picker-card-icon-size);
      height: var(--picker-card-icon-size);
      border-radius: var(--picker-card-radius);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .picker-avatar img {
      width: 100%;
      height: 100%;
      border-radius: var(--picker-card-radius);
      object-fit: cover;
    }
    .avatar-icon {
      font-size: 24dp;
    }
    .picker-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4dp;
      min-width: 0;
      flex: 1;
    }
    .picker-name {
      margin: 0;
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .real-name {
      font-weight: var(--font-weight-regular);
      opacity: 0.7;
    }
    .picker-meta {
      display: flex;
      align-items: center;
      gap: 8dp;
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .daily-kilos {
      display: flex;
      align-items: center;
      gap: 4dp;
    }
    .daily-kilos .icon {
      font-size: 14dp;
      color: var(--color-primary);
    }
    .picker-actions {
      display: flex;
      align-items: center;
      gap: 8dp;
      flex-wrap: wrap;
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40dp;
      height: 40dp;
      border: none;
      border-radius: var(--radius-full);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .icon-btn:hover,
    .icon-btn:active {
      background: var(--color-primary);
      opacity: 0.9;
    }
    .icon-btn .icon {
      font-size: 20dp;
    }
  `],
})
export class HarvestPickerCardComponent {
  picker = input.required<PickerCardData>();
  clickable = input<boolean>(true);

  cardClick = output<PickerCardData>();
  weighClick = output<PickerCardData>();

  onCardClick(event: Event): void {
    if (this.clickable()) {
      this.cardClick.emit(this.picker());
    }
  }

  onWeighClick(event: Event): void {
    event.stopPropagation();
    this.weighClick.emit(this.picker());
  }
}