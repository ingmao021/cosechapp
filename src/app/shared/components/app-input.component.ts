import { Component, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonInput, IonIcon, IonItem, IonLabel, IonButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

/**
 * Componente atómico: Input de texto/numérico
 * Espec Design System: 48dp alto mínimo, 16dp padding horizontal, radius 8dp
 * Uso: <app-input label="Cédula" type="text" [(ngModel)]="value" required minlength="5" maxlength="20" />
 */
@Component({
  selector: 'app-input',
  standalone: false,
  template: `
    <ion-item lines="full" class="input-wrapper" [class.error]="showError()">
      <ion-label position="floating">{{ label() }}</ion-label>
      <ion-input
        [type]="showPassword() ? 'text' : type()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [required]="required()"
        [minlength]="minlength()"
        [maxlength]="maxlength()"
        [inputmode]="inputmode()"
        [autocomplete]="autocomplete()"
        (ionInput)="onInput($event)"
        (ionBlur)="onBlur()"
        (ionFocus)="onFocus()"
      ></ion-input>
      @if (type() === 'password' && !readonly()) {
        <ion-button fill="clear" slot="end" (click)="togglePassword()" aria-label="Mostrar/ocultar contraseña">
          <ion-icon [name]="showPassword() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
        </ion-button>
      }
      @if (showError() && errorMessage()) {
        <div class="error-text" slot="error">{{ errorMessage() }}</div>
      }
    </ion-item>
  `,
  styles: [`
    .input-wrapper {
      --padding-start: var(--input-padding-h);
      --padding-end: var(--input-padding-h);
      --border-radius: var(--input-radius);
      min-height: var(--input-min-height);
      --background: var(--color-surface);
      --color: var(--color-text);
      --placeholder-color: var(--color-text-muted);
      --highlight-color-focused: var(--color-primary);
      --highlight-color-invalid: var(--color-accent-alert);
    }
    .input-wrapper.error {
      --highlight-color-focused: var(--color-accent-alert);
    }
    .error-text {
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      color: var(--color-accent-alert);
      margin-top: 4dp;
    }
    ion-icon {
      font-size: 20dp;
      color: var(--color-text-muted);
    }
  `],
})
export class AppInputComponent {
  // Inputs
  label = input<string>('');
  type = input<'text' | 'password' | 'email' | 'number' | 'tel'>('text');
  placeholder = input<string>('');
  value = input<string>('');
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  required = input<boolean>(false);
  minlength = input<number | null>(null);
  maxlength = input<number | null>(null);
  inputmode = input<'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url'>('text');
  autocomplete = input<string>('off');
  errorMessage = input<string>('');

  // Outputs
  valueChange = output<string>();
  blur = output<void>();
  focus = output<void>();

  // Estado interno
  showPassword = signal(false);
  touched = signal(false);
  focused = signal(false);

  // Validación computada
  showError = signal(false);

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  onInput(event: any): void {
    const val = event.target?.value ?? '';
    this.valueChange.emit(val);
  }

  onBlur(): void {
    this.touched.set(true);
    this.focused.set(false);
    this.updateErrorState();
    this.blur.emit();
  }

  onFocus(): void {
    this.focused.set(true);
    this.blur.emit();
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  private updateErrorState(): void {
    const val = this.value();
    let hasError = false;

    if (this.required() && (!val || val.trim() === '')) {
      hasError = true;
    }
    if (this.minlength() && val.length > 0 && val.length < this.minlength()!) {
      hasError = true;
    }
    if (this.maxlength() && val.length > this.maxlength()!) {
      hasError = true;
    }

    this.showError.set(this.touched() && hasError);
  }

  // HostListener para validar en cambios de value() desde fuera
  @HostListener('valueChange')
  onValueChange(): void {
    if (this.touched()) {
      this.updateErrorState();
    }
  }
}