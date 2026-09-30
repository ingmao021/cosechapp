import {
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
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
  standalone: true,
  imports: [FormsModule, IonInput, IonIcon, IonItem, IonLabel, IonButton],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppInputComponent), multi: true },
  ],
  template: `
    <ion-item lines="full" class="input-wrapper" [class.error]="showError()">
      <ion-label position="floating">{{ label() }}</ion-label>
      <ion-input
        [type]="showPassword() ? 'text' : type()"
        [placeholder]="placeholder()"
        [value]="currentValue()"
        [disabled]="isDisabled()"
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
      margin-top: 4px;
    }
    ion-icon {
      font-size: 20px;
      color: var(--color-text-muted);
    }
  `],
})
export class AppInputComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>('');
  type = input<'text' | 'password' | 'email' | 'number' | 'tel'>('text');
  placeholder = input<string>('');
  value = input<string>('');
  disabled = input(false, { transform: booleanAttribute });
  readonly = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  minlength = input<number | null, unknown>(null, { transform: optionalNumberAttribute });
  maxlength = input<number | null, unknown>(null, { transform: optionalNumberAttribute });
  inputmode = input<'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url'>('text');
  autocomplete = input<string>('off');
  errorMessage = input<string>('');

  // Outputs
  valueChange = output<string>();
  inputBlur = output<void>();
  inputFocus = output<void>();

  // Estado interno: se inicializa desde los inputs y lo actualizan el usuario o el formulario (ngModel)
  readonly currentValue = linkedSignal(() => this.value() ?? '');
  readonly isDisabled = linkedSignal(() => this.disabled());
  showPassword = signal(false);
  touched = signal(false);
  focused = signal(false);

  // Validación computada: se recalcula ante cualquier cambio de valor, incluso desde fuera
  private readonly hasError = computed(() => {
    const val = this.currentValue();
    const minlength = this.minlength();
    const maxlength = this.maxlength();

    if (this.required() && val.trim() === '') {
      return true;
    }
    if (minlength !== null && val.length > 0 && val.length < minlength) {
      return true;
    }
    if (maxlength !== null && val.length > maxlength) {
      return true;
    }
    return false;
  });
  readonly showError = computed(() => this.touched() && this.hasError());

  // Callbacks registrados por Angular Forms
  private onChange: (value: string | number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement | null)?.value ?? '';
    this.currentValue.set(val);
    this.onChange(this.toModelValue(val));
    this.valueChange.emit(val);
  }

  onBlur(): void {
    this.touched.set(true);
    this.focused.set(false);
    this.onTouched();
    this.inputBlur.emit();
  }

  onFocus(): void {
    this.focused.set(true);
    this.inputFocus.emit();
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  // ControlValueAccessor
  writeValue(value: unknown): void {
    this.currentValue.set(value === null || value === undefined ? '' : String(value));
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  /** Igual que NumberValueAccessor de Angular: los inputs numéricos entregan number (o null si está vacío). */
  private toModelValue(val: string): string | number | null {
    if (this.type() !== 'number') {
      return val;
    }
    return val === '' ? null : parseFloat(val);
  }
}

function optionalNumberAttribute(value: unknown): number | null {
  return value === null || value === undefined || value === '' ? null : numberAttribute(value, 0);
}