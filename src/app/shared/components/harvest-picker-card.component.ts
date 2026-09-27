import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem } from '@ionic/angular/ion-item';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonButton } from '@ionic/angular/ion-button';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { AppChipComponent } from './app-chip.component';
import { KilosPipe } from '../pipes/kilos.pipe';

/**
 * Molécula: Tarjeta de recolector en lista de cuadrilla
 * Espec Design System: 64dp min alto, 16dp padding, radius 12dp, avatar/icono 24dp, nombre/alias + kilos día
 * Uso: <harvest-picker-card [picker]="pickerData" (click)="onPickerClick()" (weigh)="onWeigh()" />
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
  selector: 'harvest-picker-card',
  standalone: true,
  imports: [CommonModule, IonItem, IonIcon, IonLabel, IonButton, IonAvatar, AppChipComponent, KilosPipe],
  template: `
    <ion-item
      class="picker-card"
      [button]="clickable()"
      (click)="onCardClick($event)"
      lines="none"
    >
      <ion-avatar slot="start" class="picker-avatar">
        @if (picker().avatarUrl) {
          <img [src]="picker().avatarUrl" alt="{{ picker().name }}" />
        } @else {
          <ion-icon name="person-outline"></ion-icon>
        }
      </ion-avatar>

      <ion-label class="picker-info">
        <h3 class="picker-name text-level-3">
          {{ picker().alias || picker().name }}
          @if (picker().alias) {
            <span class="real-name text-level-4">({{ picker().name }})</span>
          }
        </h3>
        <div class="picker-meta text-level-4">
          <span class="daily-kilos">
            <ion-icon name="scale-outline" size="small"></ion-icon>
            {{ picker().dailyKilos | kilos }}
            hoy
          </span>
        </div>
      </ion-label>

      <div class="picker-actions" slot="end">
        <app-chip
          [variant]="picker().hasMeals ? 'meal-with' : 'meal-without'"
          [icon]="picker().hasMeals ? 'restaurant-outline' : 'restaurant-off-outline'"
        >
          {{ picker().hasMeals ? 'Con alimentación' : 'Sin alimentación' }}
        </app-chip>
        <ion-button
          fill="clear"
          color="primary"
          size="small"
          (click)="onWeighClick($event)"
          aria-label="Registrar pesada para {{ picker().name }}"
        >
          <ion-icon name="add-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>
    </ion-item>
  `,
  styles: [`
    .picker-card {
      --border-radius: var(--picker-card-radius);
      --background: var(--color-surface);
      --padding-start: var(--picker-card-padding);
      --padding-end: var(--picker-card-padding);
      min-height: var(--picker-card-min-height);
      box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .picker-card:active {
      transform: scale(0.99);
      box-shadow: 0 2dp 6dp rgba(43,36,32,0.16);
    }
    .picker-avatar {
      width: var(--picker-card-icon-size);
      height: var(--picker-card-icon-size);
      --border-radius: var(--picker-card-radius);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
    }
    .picker-avatar img {
      width: 100%;
      height: 100%;
      border-radius: var(--picker-card-radius);
      object-fit: cover;
    }
    .picker-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4dp;
      min-width: 0;
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
    .daily-kilos ion-icon {
      font-size: 14dp;
      color: var(--color-primary);
    }
    .picker-actions {
      display: flex;
      align-items: center;
      gap: 8dp;
      flex-wrap: wrap;
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