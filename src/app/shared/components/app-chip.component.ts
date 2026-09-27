import { Component, input } from '@angular/core';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular';

/**
 * Componente atómico: Chip (estado, alimentación, etc.)
 * Espec Design System: 28dp alto, 12dp padding horizontal, radius pill (999dp), icono 16dp opcional
 * Variantes: 'default' | 'meal-with' | 'meal-without' | 'status-active' | 'status-closed' | 'sync'
 * Uso: <app-chip variant="meal-with" icon="restaurant-outline">Con alimentación</app-chip>
 */
@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [IonChip, IonIcon, IonLabel],
  template: `
    <ion-chip [color]="chipColor()" [outline]="outline()">
      @if (icon()) {
        <ion-icon [name]="icon()" slot="start"></ion-icon>
      }
      <ion-label><ng-content></ng-content></ion-label>
    </ion-chip>
  `,
  styles: [`
    ion-chip {
      --border-radius: var(--chip-radius);
      --padding-start: var(--chip-padding-h);
      --padding-end: var(--chip-padding-h);
      height: var(--chip-height);
      min-height: var(--chip-height);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-regular);
    }
    ion-icon {
      font-size: var(--chip-icon-size);
    }
  `],
})
export class AppChipComponent {
  variant = input<'default' | 'meal-with' | 'meal-without' | 'status-active' | 'status-closed' | 'sync' | 'fnc'>('default');
  icon = input<string | null>(null);
  outline = input<boolean>(false);

  chipColor() {
    switch (this.variant()) {
      case 'meal-with': return 'primary';
      case 'meal-without': return 'medium';
      case 'status-active': return 'success';
      case 'status-closed': return 'medium';
      case 'sync': return 'medium';
      case 'fnc': return 'medium';
      default: return 'medium';
    }
  }
}