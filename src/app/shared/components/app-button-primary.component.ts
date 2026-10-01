import { Component, booleanAttribute, input, output, HostBinding } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { refreshCircleOutline } from 'ionicons/icons';

/**
 * Componente atómico: Botón primario
 * Espec Design System: 48dp alto, 24dp padding horizontal, radius 24dp (pill), icono 20dp opcional
 * Uso: <app-button-primary (buttonClick)="onSubmit()" [loading]="isLoading">Ingresar</app-button-primary>
 */
@Component({
  selector: 'app-button-primary',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <ion-button
      [type]="type()"
      [expand]="expand()"
      [fill]="fill()"
      [color]="color()"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <ion-icon name="refresh-circle-outline" slot="start" class="spin"></ion-icon>
        {{ loadingText() }}
      } @else {
        @if (iconStart()) {
          <ion-icon [name]="iconStart()" slot="start"></ion-icon>
        }
        <ng-content></ng-content>
        @if (iconEnd()) {
          <ion-icon [name]="iconEnd()" slot="end"></ion-icon>
        }
      }
    </ion-button>
  `,
  styles: [`
    :host {
      display: block;
    }
    ion-button {
      --border-radius: var(--btn-primary-radius);
      --padding-start: var(--btn-primary-padding-h);
      --padding-end: var(--btn-primary-padding-h);
      height: var(--btn-primary-height);
      min-height: var(--btn-primary-height);
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      --background: var(--color-primary);
      --background-activated: var(--color-primary);
      --background-hover: var(--color-primary);
      --color: var(--color-text-on-primary);
    }
    ion-button[color="danger"] {
      --background: var(--color-accent-alert);
      --background-activated: var(--color-accent-alert);
      --background-hover: var(--color-accent-alert);
      --color: var(--color-text-on-alert);
    }
    ion-button[color="secondary"] {
      --background: var(--color-secondary);
      --background-activated: var(--color-secondary);
      --background-hover: var(--color-secondary);
      --color: var(--color-text-on-primary);
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
})
export class AppButtonPrimaryComponent {
  // Inputs
  type = input<'submit' | 'button' | 'reset'>('button');
  expand = input<'block' | 'full' | ''>('block');
  fill = input<'solid' | 'outline' | 'clear'>('solid');
  color = input<'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'medium' | 'light' | 'dark'>('primary');
  disabled = input(false, { transform: booleanAttribute }); // acepta form.invalid (boolean | null)
  loading = input(false, { transform: booleanAttribute });
  loadingText = input<string>('Cargando...');
  iconStart = input<string | null>(null);
  iconEnd = input<string | null>(null);

  // Output
  buttonClick = output<Event>();

  constructor() {
    addIcons({ refreshCircleOutline });
  }

  onClick(event: Event): void {
    if (!this.disabled() && !this.loading()) {
      this.buttonClick.emit(event);
    }
  }
}