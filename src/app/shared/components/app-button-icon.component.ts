import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';

/**
 * Componente atómico: Botón de ícono (ej. "+" para agregar pesada)
 * Espec Design System: 48×48dp, radius 24dp (circular), icono 24dp
 * Uso: <app-button-icon icon="add-outline" (click)="onAdd()" />
 */
@Component({
  selector: 'app-button-icon',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <ion-button
      [fill]="fill()"
      [color]="color()"
      [disabled]="disabled()"
      [aria-label]="ariaLabel()"
      (click)="onClick($event)"
    >
      <ion-icon [name]="icon()"></ion-icon>
    </ion-button>
  `,
  styles: [`
    ion-button {
      --border-radius: var(--btn-icon-radius);
      width: var(--btn-icon-size);
      height: var(--btn-icon-size);
      min-width: var(--btn-icon-size);
      min-height: var(--btn-icon-size);
      --padding-start: 0;
      --padding-end: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    ion-icon {
      font-size: var(--btn-icon-icon-size);
    }
    ion-button[fill="clear"] {
      --background: transparent;
      --background-hover: var(--color-border);
    }
    ion-button[color="primary"] {
      --color: var(--color-primary);
    }
  `],
})
export class AppButtonIconComponent {
  // Inputs
  icon = input.required<string>();
  fill = input<'solid' | 'outline' | 'clear'>('clear');
  color = input<'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'medium' | 'light' | 'dark'>('primary');
  disabled = input<boolean>(false);
  ariaLabel = input<string>('');

  // Output
  click = output<Event>();

  onClick(event: Event): void {
    if (!this.disabled()) {
      this.click.emit(event);
    }
  }
}