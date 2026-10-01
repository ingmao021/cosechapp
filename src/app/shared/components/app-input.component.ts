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
import { IonInput } from '@ionic/angular/ion-input';
import { IonInputPasswordToggle } from '@ionic/angular/ion-input-password-toggle';

/**
 * Componente atómico: Input de texto/numérico
 * Espec Design System: 48dp alto mínimo, 16dp padding horizontal, radius 8dp.
 * Etiqueta siempre visible encima del campo (stacked): más clara que una etiqueta flotante
 * para usuarios con baja alfabetización digital, y no se monta sobre el placeholder.
 * Uso: <app-input label="Cédula" type="text" [(ngModel)]="value" required minlength="5" maxlength="20" />
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [FormsModule, IonInput, IonInputPasswordToggle],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppInputComponent), multi: true },
  ],
  template: `
    <ion-input
      class="field"
      fill="outline"
      labelPlacement="stacked"
      [label]="label()"
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="currentValue()"
      [disabled]="isDisabled()"
      [readonly]="readonly()"
      [required]="required()"
      [minlength]="minlength()"
      [maxlength]="maxlength()"
      [inputmode]="inputmode()"
      [autocomplete]="autocomplete()"
      [helperText]="helperText()"
      [errorText]="errorMessage()"
      [class.ion-touched]="touched()"
      [class.ion-invalid]="showError()"
      [class.ion-valid]="!showError()"
      (ionInput)="onInput($event)"
      (ionBlur)="onBlur()"
      (ionFocus)="onFocus()"
    >
      @if (type() === 'password' && !readonly()) {
        <ion-input-password-toggle slot="end" showLabel="Mostrar contraseña" hideLabel="Ocultar contraseña"></ion-input-password-toggle>
      }
    </ion-input>
  `,
  styles: [`
    :host {
      display: block;
    }
    .field {
      --background: var(--color-surface);
      --color: var(--color-text);
      --placeholder-color: var(--color-text-muted);
      --placeholder-opacity: 1;
      --border-color: var(--color-border);
      --border-radius: var(--input-radius);
      --padding-start: var(--input-padding-h);
      --padding-end: var(--input-padding-h);
      --highlight-color-focused: var(--color-primary);
      --highlight-color-valid: var(--color-primary);
      --highlight-color-invalid: var(--color-accent-alert);
      min-height: var(--input-min-height);
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
    }
    .field::part(label) {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
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
  /** Texto de ayuda bajo el campo (se reemplaza por errorMessage cuando hay error). */
  helperText = input<string>('');

  // Outputs
  valueChange = output<string>();
  inputBlur = output<void>();
  inputFocus = output<void>();

  // Estado interno: se inicializa desde los inputs y lo actualizan el usuario o el formulario (ngModel)
  readonly currentValue = linkedSignal(() => this.value() ?? '');
  readonly isDisabled = linkedSignal(() => this.disabled());
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