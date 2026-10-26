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
import { IonIcon } from '@ionic/angular/ion-icon';

/**
 * Componente atómico: Input de texto/numérico
 * Espec Design System: 52dp alto mínimo, 16dp padding horizontal, radius 14dp.
 * Etiqueta siempre visible encima de la caja (fuera de ella, estilo sistema): más clara
 * que una etiqueta flotante para usuarios con baja alfabetización digital, y no se monta
 * sobre el placeholder. Al enfocar, la etiqueta, el ícono y el borde pasan a verde.
 * Uso: <app-input label="Cédula" iconStart="id-card-outline" [(ngModel)]="value" required />
 * El ícono lo registra la página que lo usa (addIcons), como con cualquier ion-icon.
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [FormsModule, IonInput, IonInputPasswordToggle, IonIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppInputComponent), multi: true },
  ],
  template: `
    @if (label()) {
      <!-- Visual: el nombre accesible lo lleva el campo (aria-label). Tocarla enfoca el campo. -->
      <span class="field-label" [class.is-focused]="focused()" [class.is-invalid]="showError()" aria-hidden="true" (click)="field.setFocus()">{{ label() }}</span>
    }
    <ion-input
      #field
      class="field"
      [class.has-icon]="iconStart()"
      fill="outline"
      [attr.aria-label]="label() || null"
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="currentValue()"
      [disabled]="isDisabled()"
      [readonly]="readonly()"
      [required]="required()"
      [minlength]="minlength()"
      [maxlength]="maxlength()"
      [inputmode]="inputmode()"
      [enterkeyhint]="enterkeyhint()"
      [autocapitalize]="autocapitalize()"
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
      @if (iconStart()) {
        <ion-icon slot="start" class="field-icon" [class.is-focused]="focused()" [name]="iconStart()" aria-hidden="true"></ion-icon>
      }
      @if (type() === 'password' && !readonly()) {
        <ion-input-password-toggle slot="end" color="medium" showLabel="Mostrar contraseña" hideLabel="Ocultar contraseña"></ion-input-password-toggle>
      }
    </ion-input>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    /* Etiqueta encima de la caja, sangrada 4dp para alinearse con la curva del borde. */
    .field-label {
      padding-left: var(--spacing-xs);
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      line-height: 1.3;
      transition: color var(--dur-fast) var(--ease-out);
    }
    .field-label.is-focused {
      color: var(--color-primary-ink);
    }
    .field-label.is-invalid {
      color: var(--color-accent-alert);
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
      --highlight-color-focused: var(--color-primary-ink);
      --highlight-color-valid: var(--color-primary-ink);
      --highlight-color-invalid: var(--color-accent-alert);
      min-height: var(--input-min-height);
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
    }
    /* Ícono inicial: gris en reposo, verde al enfocar; 12dp de aire hasta el texto. */
    .field-icon {
      flex-shrink: 0;
      margin-inline-end: var(--row-gap);
      font-size: 22px;
      color: var(--color-text-muted);
      transition: color var(--dur-fast) var(--ease-out);
    }
    .field-icon.is-focused {
      color: var(--color-primary-ink);
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
  /** Qué dice la tecla Enter del teclado del teléfono. */
  enterkeyhint = input<'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | undefined>(undefined);
  /** 'off' en cédulas y códigos; 'words' en nombres. */
  autocapitalize = input<'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'>('off');
  errorMessage = input<string>('');
  /** Texto de ayuda bajo el campo (se reemplaza por errorMessage cuando hay error). */
  helperText = input<string>('');
  /** Ícono al inicio del campo (ej. 'id-card-outline'). */
  iconStart = input<string | null>(null);

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